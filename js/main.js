/* ==========================================================================
   The Common Athlete — main.js
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Intro reveal (first visit, Home only) ----------
     Plays a one-time curtain-split intro, then cascades the hero in. Skips
     when: there's no #intro on the page, the user prefers reduced motion, or
     it has already played this browser session. The hero is always revealed
     either way, so content never gets stuck hidden. */
  (function intro() {
    var intro = document.getElementById("intro");
    var hero = document.querySelector(".hero--reveal");
    var body = document.body;
    var docEl = document.documentElement;

    var revealHero = function () {
      docEl.classList.remove("intro-pending");
      body.classList.add("intro-revealed");          // drops nav + announce in
      if (hero) hero.classList.add("is-revealed");    // hero cascade + image wipe
    };

    var reduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var seen;
    try { seen = sessionStorage.getItem("tca_intro_seen") === "1"; } catch (e) { seen = false; }

    if (!intro || reduced || seen) {
      if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
      docEl.classList.remove("intro-pending");
      if (hero) hero.classList.add("is-revealed");
      return;
    }

    try { sessionStorage.setItem("tca_intro_seen", "1"); } catch (e) {}

    var timers = [];
    var finished = false;

    body.classList.add("intro-active");
    intro.classList.add("is-playing");

    // Reveal the site as the slats begin sweeping away, then remove the overlay.
    var heroT = setTimeout(revealHero, 1450);
    var cleanupT = setTimeout(function () {
      finished = true;
      body.classList.remove("intro-active");
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }, 2450);
    timers.push(heroT, cleanupT);

    // Skip: fast-forward straight to the revealed site.
    function skip() {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      intro.classList.add("intro--skip");            // fades overlay out fast
      revealHero();
      setTimeout(function () {
        body.classList.remove("intro-active");
        if (intro.parentNode) intro.parentNode.removeChild(intro);
      }, 360);
    }
    var skipBtn = document.getElementById("introSkip");
    if (skipBtn) skipBtn.addEventListener("click", skip);
    intro.addEventListener("click", function (e) {
      // click anywhere on the backdrop (not the skip button itself) also skips
      if (e.target === skipBtn) return;
      skip();
    });
  })();

  /* ---------- Page transitions (fade + soft rise between tabs) ----------
     Plays an exit fade before same-site navigations and an enter animation on
     load. Degrades to plain navigation for new-tab/modifier clicks, external
     links, downloads, hash jumps, reduced motion, or when JS is unavailable. */
  (function pageTransitions() {
    var reduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    function isModified(e) {
      return e.defaultPrevented || e.button !== 0 ||
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
    }

    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a");
      if (!a) return;
      if (isModified(e)) return;
      if (a.target && a.target !== "_self") return;       // new tab/window
      if (a.hasAttribute("download")) return;

      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#") return;          // in-page anchor
      if (a.origin !== location.origin) return;             // external link
      // same page (ignoring hash)? let the browser handle it
      if (a.pathname === location.pathname && a.search === location.search) return;

      e.preventDefault();
      document.body.classList.add("pt-leave");
      var done = false;
      var nav = function () { if (!done) { done = true; window.location.href = a.href; } };
      document.body.addEventListener("animationend", nav, { once: true });
      setTimeout(nav, 340); // fallback if animationend doesn't fire
    });

    // Restore from bfcache (back/forward) without a stuck faded-out page.
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) document.body.classList.remove("pt-leave");
    });
  })();

  /* ---------- Current year in footer ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Announcement bar dismiss ---------- */
  var announceBar = document.getElementById("announce");
  var announceClose = document.getElementById("announceClose");
  if (announceBar && announceClose) {
    try {
      if (sessionStorage.getItem("tca_announce_closed") === "1") {
        announceBar.style.display = "none";
      }
    } catch (e) {}
    announceClose.addEventListener("click", function () {
      announceBar.style.display = "none";
      try { sessionStorage.setItem("tca_announce_closed", "1"); } catch (e) {}
    });
  }

  /* ---------- Mobile menu toggle ---------- */
  var burger = document.getElementById("burger");
  var mobileMenu = document.getElementById("mobileMenu");

  function closeMobileMenu() {
    if (!burger || !mobileMenu) return;
    burger.classList.remove("is-open");
    mobileMenu.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Open menu");
    mobileMenu.setAttribute("aria-hidden", "true");
  }

  if (burger && mobileMenu) {
    burger.addEventListener("click", function () {
      var open = mobileMenu.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mobileMenu.setAttribute("aria-hidden", String(!open));
    });
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMobileMenu);
    });
  }

  /* ---------- FAQ aria-expanded ---------- */
  document.querySelectorAll(".faq__item").forEach(function (item) {
    var summary = item.querySelector("summary");
    if (!summary) return;
    item.addEventListener("toggle", function () {
      summary.setAttribute("aria-expanded", String(item.open));
    });
  });

  /* ---------- Bag / cart drawer ---------- */
  var STORAGE_KEY = "tca_bag";
  var bag = loadBag();
  var bagBtn = document.getElementById("bagBtn");
  var bagCount = document.getElementById("bagCount");
  var drawer = document.getElementById("bagDrawer");
  var overlay = document.getElementById("drawerOverlay");
  var drawerClose = document.getElementById("drawerClose");
  var drawerBody = document.getElementById("drawerBody");
  var drawerTotal = document.getElementById("drawerTotal");
  var checkoutBtn = document.getElementById("checkoutBtn");
  var shipMsg = document.getElementById("shipMsg");
  var shipFill = document.getElementById("shipFill");
  var FREE_SHIP = 60;

  function money(n) { return "S$" + n.toFixed(2); }

  // Update the "X away from free delivery" progress meter.
  function renderShipping(total) {
    if (!shipMsg || !shipFill) return;
    var pct = Math.min(100, (total / FREE_SHIP) * 100);
    shipFill.style.width = pct + "%";
    if (total >= FREE_SHIP) {
      shipMsg.innerHTML = "🎉 You've unlocked <strong>free delivery</strong>!";
      shipFill.classList.add("is-complete");
    } else {
      shipFill.classList.remove("is-complete");
      shipMsg.innerHTML = "You're <strong>" + money(FREE_SHIP - total) +
        "</strong> away from free delivery.";
    }
  }

  function loadBag() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveBag() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(bag)); }
    catch (e) {}
  }

  function openDrawer() {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add("is-open"); });
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(function () { overlay.hidden = true; }, 300);
  }

  function renderBag() {
    saveBag();
    var count = bag.reduce(function (s, i) { return s + i.qty; }, 0);
    var total = bag.reduce(function (s, i) { return s + i.qty * i.price; }, 0);
    if (bagCount) bagCount.textContent = String(count);
    if (drawerTotal) drawerTotal.textContent = money(total);
    if (checkoutBtn) checkoutBtn.disabled = count === 0;

    var shipWrap = document.getElementById("shipMeter");
    if (shipWrap) shipWrap.hidden = count === 0;
    renderShipping(total);

    if (!drawerBody) return;
    if (bag.length === 0) {
      // Path to the women's shop differs by directory depth.
      var shopHref = /\/shop\//.test(location.pathname) ? "women.html" : "shop/women.html";
      drawerBody.innerHTML =
        '<div class="drawer__empty">' +
          '<p>Your bag is empty.</p>' +
          '<a href="' + shopHref + '" class="btn btn--outline btn--block">Shop the collection</a>' +
        '</div>';
      return;
    }

    drawerBody.innerHTML = bag.map(function (item, idx) {
      var sizeLabel = item.size ? '<div class="bag-item__size">Size: ' + item.size + '</div>' : '';
      return (
        '<div class="bag-item">' +
          '<div class="bag-item__thumb ph"><img src="' + item.img + '" alt="" /></div>' +
          '<div class="bag-item__info">' +
            '<div class="bag-item__name">' + item.name + '</div>' +
            sizeLabel +
            '<div class="bag-item__price">' + money(item.price) + '</div>' +
            '<div class="bag-item__qty">' +
              '<button data-act="dec" data-idx="' + idx + '" aria-label="Decrease quantity">−</button>' +
              '<span>' + item.qty + '</span>' +
              '<button data-act="inc" data-idx="' + idx + '" aria-label="Increase quantity">+</button>' +
            '</div>' +
            '<button class="bag-item__remove" data-act="rm" data-idx="' + idx + '">Remove</button>' +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  function addToBag(name, price, img, size) {
    var existing = bag.find(function (i) { return i.name === name && i.size === size; });
    if (existing) { existing.qty += 1; }
    else { bag.push({ name: name, price: price, img: img, size: size, qty: 1 }); }
    renderBag();
    bumpBagCount();
    showToast(name, img);
  }

  /* ---------- Add-to-bag toast ---------- */
  var toastEl, toastTimer;
  function showToast(name, img) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML =
      '<div class="toast__thumb ph"><img src="' + img + '" alt="" /></div>' +
      '<div class="toast__text"><strong>Added to bag</strong><span>' + name + '</span></div>' +
      '<button class="toast__view" type="button">View bag</button>';
    toastEl.querySelector(".toast__view").addEventListener("click", function () {
      hideToast();
      openDrawer();
    });
    // force reflow so the transition re-triggers on rapid adds
    void toastEl.offsetWidth;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 3200);
  }
  function hideToast() {
    if (toastEl) toastEl.classList.remove("is-visible");
  }

  /* ---------- Bag count bump ---------- */
  function bumpBagCount() {
    if (!bagCount) return;
    bagCount.classList.remove("is-bumped");
    void bagCount.offsetWidth;
    bagCount.classList.add("is-bumped");
  }

  /* ---------- Size pill selection ---------- */
  document.querySelectorAll(".sizes").forEach(function (group) {
    group.addEventListener("click", function (e) {
      var pill = e.target.closest(".size");
      if (!pill) return;
      group.classList.remove("needs-pick");
      group.querySelectorAll(".size").forEach(function (s) { s.classList.remove("is-active"); });
      pill.classList.add("is-active");
    });
  });

  function selectedSize(scope) {
    var active = scope.querySelector(".size.is-active");
    return active ? active.textContent.trim() : "";
  }
  function requireSize(group) {
    group.classList.add("needs-pick");
    setTimeout(function () { group.classList.remove("needs-pick"); }, 600);
  }

  /* ---------- Read product details from the rendered markup ----------
     The visible price/name/image are the single source of truth, so editing
     copy in index.html keeps the bag in sync automatically. Each lookup falls
     back to a data-* attribute, then a sensible default. */
  function parsePrice(text) {
    // Strip currency symbols/whitespace, keep digits + decimal point.
    var n = parseFloat((text || "").replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  }
  function textOf(scope, selector) {
    var el = scope.querySelector(selector);
    return el ? el.textContent.trim() : "";
  }
  function readProduct(scope, priceSelector) {
    var img = scope.querySelector("img");
    return {
      name: textOf(scope, ".card__name") || scope.dataset.name || "",
      price: parsePrice(textOf(scope, priceSelector)) || parseFloat(scope.dataset.price) || 0,
      img: (img && img.getAttribute("src")) || scope.dataset.img || ""
    };
  }
  function flashAdded(btn) {
    var orig = btn.textContent;
    btn.classList.add("btn--added");
    btn.textContent = "✓ Added";
    setTimeout(function () {
      btn.classList.remove("btn--added");
      btn.textContent = orig;
    }, 900);
  }

  /* ---------- "Add to bag" with success feedback ---------- */
  document.querySelectorAll(".add-to-bag").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest(".card");
      if (!card) return;
      var group = card.querySelector(".sizes");
      var size = selectedSize(card);
      if (group && !size) { requireSize(group); return; }

      flashAdded(btn);
      var p = readProduct(card, ".card__price");
      addToBag(p.name, p.price, p.img, size);
    });
  });

  /* ---------- "Add set" — Everyday Set bundle ---------- */
  var addSetBtn = document.querySelector(".add-set");
  if (addSetBtn) {
    addSetBtn.addEventListener("click", function () {
      var scope = document.querySelector(".set-buy");
      if (!scope) return;
      var group = scope.querySelector(".sizes");
      var size = selectedSize(scope);
      if (group && !size) { requireSize(group); return; }

      flashAdded(addSetBtn);
      // The set's price is shown in .set-price__now (single source of truth);
      // name + image stay on the .set-buy data-* attributes since they aren't
      // rendered elsewhere in a reusable form.
      var section = document.getElementById("set");
      var price = parsePrice(section ? textOf(section, ".set-price__now") : "")
        || parseFloat(scope.dataset.price) || 0;
      addToBag(scope.dataset.name, price, scope.dataset.img, size);
    });
  }

  /* ---------- Wishlist / save (♥) ----------
     Saves products by name in localStorage and reflects the state on every
     heart (cards + quick-view) across the site. */
  var WISH_KEY = "tca_wishlist";
  function loadWish() {
    try { return JSON.parse(localStorage.getItem(WISH_KEY)) || []; }
    catch (e) { return []; }
  }
  var wishlist = loadWish();
  function saveWish() {
    try { localStorage.setItem(WISH_KEY, JSON.stringify(wishlist)); } catch (e) {}
  }
  function wishlistHas(name) { return wishlist.indexOf(name) !== -1; }
  function wishlistToggle(name) {
    var i = wishlist.indexOf(name);
    if (i === -1) wishlist.push(name); else wishlist.splice(i, 1);
    saveWish();
    syncWishUI(name);
    return wishlistHas(name);
  }
  // Keep every heart for a product in sync (cards + modal).
  function syncWishUI(name) {
    var saved = wishlistHas(name);
    document.querySelectorAll('.wish[data-name="' + cssEscape(name) + '"]').forEach(function (b) {
      b.classList.toggle("is-saved", saved);
      b.setAttribute("aria-pressed", String(saved));
      b.setAttribute("aria-label", (saved ? "Saved — remove " : "Save ") + name);
    });
  }
  function cssEscape(s) { return (s || "").replace(/"/g, '\\"'); }
  function makeHeart(name) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "wish";
    b.dataset.name = name;
    b.innerHTML =
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
      '<path d="M12 21s-7.5-4.6-10-9.2C.4 8.5 2 5 5.3 5c2 0 3.3 1.1 4.2 2.4C10.4 6.1 11.7 5 13.7 5 17 5 18.6 8.5 17 11.8 14.5 16.4 12 21 12 21z"/>' +
      '</svg>';
    b.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      wishlistToggle(name);
    });
    return b;
  }
  // Add a heart to each product card.
  document.querySelectorAll(".grid--products .card").forEach(function (card) {
    var media = card.querySelector(".ph--card");
    var name = card.dataset.name;
    if (!media || !name) return;
    var heart = makeHeart(name);
    heart.classList.toggle("is-saved", wishlistHas(name));
    heart.setAttribute("aria-pressed", String(wishlistHas(name)));
    heart.setAttribute("aria-label", (wishlistHas(name) ? "Saved — remove " : "Save ") + name);
    media.appendChild(heart);
  });

  /* ---------- Quick-view modal ----------
     Built from whichever card is opened, so product data stays in one place
     (the cards). Adds a "Quick view" button to each card image, then mirrors
     that card's photo, copy, swatches and sizes into a shared modal. */
  (function quickView() {
    var qv = document.getElementById("quickView");
    if (!qv) return;
    var qvImg = document.getElementById("qvImg");
    var qvName = document.getElementById("qvName");
    var qvPrice = document.getElementById("qvPrice");
    var qvDesc = document.getElementById("qvDesc");
    var qvSwatches = document.getElementById("qvSwatches");
    var qvSwatchLabel = document.getElementById("qvSwatchLabel");
    var qvSizes = document.getElementById("qvSizes");
    var qvAdd = document.getElementById("qvAdd");
    var qvClose = document.getElementById("qvClose");
    var qvOverlay = document.getElementById("qvOverlay");
    var lastFocus = null;

    function open(card) {
      lastFocus = document.activeElement;
      var img = card.querySelector(".ph--card img");
      qvImg.src = img ? img.getAttribute("src") : "";
      qvImg.alt = card.dataset.name || "";
      qvName.textContent = textOf(card, ".card__name") || card.dataset.name || "";
      qvPrice.textContent = textOf(card, ".card__price");
      qvDesc.textContent = textOf(card, ".card__desc");

      // Refresh the modal's heart for this product.
      var qvMedia = qv.querySelector(".qv__media");
      var oldHeart = qvMedia.querySelector(".wish");
      if (oldHeart) oldHeart.remove();
      var name = card.dataset.name;
      if (name) {
        var heart = makeHeart(name);
        heart.classList.toggle("is-saved", wishlistHas(name));
        heart.setAttribute("aria-pressed", String(wishlistHas(name)));
        heart.setAttribute("aria-label", (wishlistHas(name) ? "Saved — remove " : "Save ") + name);
        qvMedia.appendChild(heart);
      }

      // Clone swatches (with their data-img) and wire image swap + label.
      qvSwatches.innerHTML = card.querySelector(".swatches").innerHTML;
      qvSwatchLabel.textContent = "";
      qvSwatches.querySelectorAll(".sw").forEach(function (sw) {
        sw.classList.remove("is-selected");
        sw.setAttribute("aria-pressed", "false");
        if (!sw.getAttribute("aria-label")) {
          sw.setAttribute("aria-label", sw.getAttribute("title") || sw.dataset.color || "Colour");
        }
      });

      // Clone sizes fresh (unselected).
      qvSizes.innerHTML = card.querySelector(".sizes").innerHTML;
      qvSizes.querySelectorAll(".size").forEach(function (s) { s.classList.remove("is-active"); });

      qv.classList.add("is-open");
      qv.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      qvClose.focus();
    }
    function close() {
      qv.classList.remove("is-open");
      qv.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }

    // Add a "Quick view" trigger to every product card image.
    document.querySelectorAll(".grid--products .card").forEach(function (card) {
      var media = card.querySelector(".ph--card");
      if (!media) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "qv__trigger";
      btn.textContent = "Quick view";
      btn.addEventListener("click", function () { open(card); });
      media.appendChild(btn);
    });

    // Modal swatch → swap modal image + label.
    qvSwatches.addEventListener("click", function (e) {
      var sw = e.target.closest(".sw");
      if (!sw) return;
      qvSwatches.querySelectorAll(".sw").forEach(function (s) {
        s.classList.remove("is-selected"); s.setAttribute("aria-pressed", "false");
      });
      sw.classList.add("is-selected");
      sw.setAttribute("aria-pressed", "true");
      var colour = sw.getAttribute("title") || sw.dataset.color;
      qvSwatchLabel.textContent = "Colour: " + colour;
      if (sw.dataset.img) {
        qvImg.src = sw.dataset.img;
        qvImg.alt = qvName.textContent + " in " + colour;
      }
    });
    qvSwatches.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        var sw = e.target.closest(".sw");
        if (sw) { e.preventDefault(); sw.click(); }
      }
    });

    // Modal size pick (delegated, since sizes are injected).
    qvSizes.addEventListener("click", function (e) {
      var pill = e.target.closest(".size");
      if (!pill) return;
      qvSizes.classList.remove("needs-pick");
      qvSizes.querySelectorAll(".size").forEach(function (s) { s.classList.remove("is-active"); });
      pill.classList.add("is-active");
    });

    qvAdd.addEventListener("click", function () {
      var size = selectedSize(qv);
      if (qvSizes.querySelector(".size") && !size) { requireSize(qvSizes); return; }
      addToBag(qvName.textContent, parsePrice(qvPrice.textContent), qvImg.getAttribute("src"), size);
      close();
    });

    qvClose.addEventListener("click", close);
    qvOverlay.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && qv.classList.contains("is-open")) close();
    });
  })();

  /* ---------- Quantity / remove controls ---------- */
  if (drawerBody) {
    drawerBody.addEventListener("click", function (e) {
      var t = e.target.closest("button[data-act]");
      if (!t) return;
      var idx = parseInt(t.dataset.idx, 10);
      var act = t.dataset.act;
      if (act === "inc") bag[idx].qty += 1;
      else if (act === "dec") { bag[idx].qty -= 1; if (bag[idx].qty <= 0) bag.splice(idx, 1); }
      else if (act === "rm") bag.splice(idx, 1);
      renderBag();
    });
  }

  if (bagBtn) bagBtn.addEventListener("click", openDrawer);
  if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
  if (overlay) overlay.addEventListener("click", closeDrawer);

  /* Checkout → compose WhatsApp message with bag contents */
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      if (checkoutBtn.disabled) return;
      var lines = bag.map(function (i) {
        return i.name + " (Size: " + (i.size || "One size") + ") x" + i.qty;
      });
      var total = bag.reduce(function (s, i) { return s + i.qty * i.price; }, 0);
      var msg = "Hi The Common Athlete! I'd like to order:\n\n" +
        lines.join("\n") +
        "\n\nSubtotal: S$" + total.toFixed(2) +
        "\n\nPlease confirm and send payment details. Thank you!";
      closeDrawer();
      window.open("https://wa.me/6597799779?text=" + encodeURIComponent(msg), "_blank", "noopener");
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeDrawer(); closeMobileMenu(); }
  });

  /* ---------- Swatch selection — swap product photo + label ---------- */
  document.querySelectorAll(".swatches").forEach(function (group) {
    group.addEventListener("click", function (e) {
      var sw = e.target.closest(".sw");
      if (!sw) return;

      /* Deselect all, mark selected. Use a class (box-shadow ring) rather than
         an inline outline so it never collides with the keyboard focus ring. */
      group.querySelectorAll(".sw").forEach(function (s) {
        s.classList.remove("is-selected");
        s.setAttribute("aria-pressed", "false");
      });
      sw.classList.add("is-selected");
      sw.setAttribute("aria-pressed", "true");

      var colour = sw.getAttribute("title") || sw.dataset.color;

      /* Update colour label */
      var label = group.nextElementSibling;
      if (label && label.classList.contains("swatch-label")) {
        label.textContent = "Colour: " + colour;
      }

      /* Swap the card's product photo to the selected colour. The chosen
         image also becomes what gets added to the bag (data-img on the card). */
      var card = group.closest(".card");
      var img = sw.dataset.img;
      if (card && img) {
        var cardImg = card.querySelector(".ph--card img");
        if (cardImg) {
          cardImg.src = img;
          cardImg.alt = card.dataset.name + " in " + colour + " — front and back";
        }
        card.dataset.img = img;
      }
    });

    /* Keyboard support + reliable accessible name for each swatch dot */
    group.querySelectorAll(".sw").forEach(function (sw) {
      if (!sw.getAttribute("aria-label")) {
        sw.setAttribute("aria-label", sw.getAttribute("title") || sw.dataset.color || "Colour");
      }
      sw.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sw.click(); }
      });
    });
  });

  /* ---------- Email signup forms (waitlist + footer newsletter) ----------
     Set FORM_ENDPOINT to your form service / email provider URL (e.g. a
     Formspree endpoint "https://formspree.io/f/xxxxxxxx", a Klaviyo/Mailchimp
     proxy, or your own handler). When set, signups are POSTed there as
     FormData. While it's empty, the forms still validate and show the success
     message so the UI works locally — they just don't send anywhere yet. */
  var FORM_ENDPOINT = "";

  // Submit a form's fields to FORM_ENDPOINT. Resolves true on success (or when
  // no endpoint is configured), false on network/server error.
  function submitSignup(form) {
    if (!FORM_ENDPOINT) return Promise.resolve(true);
    return fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form)
    })
      .then(function (res) { return res.ok; })
      .catch(function () { return false; });
  }

  // Briefly disable the submit button and show a sending label while in flight.
  function withPending(btn, run) {
    if (!btn) { run(); return; }
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Sending…";
    Promise.resolve(run()).then(function () {
      btn.disabled = false;
      btn.textContent = label;
    });
  }

  /* ---------- Waitlist form ---------- */
  var waitlistForm = document.getElementById("waitlistForm");
  var waitlistSuccess = document.getElementById("waitlistSuccess");
  if (waitlistForm) {
    waitlistForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = waitlistForm.querySelector("#email");
      if (!email.value || !email.checkValidity()) { email.focus(); return; }
      var consent = waitlistForm.querySelector("#consent");
      var consentLabel = consent ? consent.closest(".consent") : null;
      if (consent && !consent.checked) {
        if (consentLabel) {
          consentLabel.classList.add("needs-pick");
          setTimeout(function () { consentLabel.classList.remove("needs-pick"); }, 1200);
        }
        consent.focus();
        return;
      }
      var submitBtn = waitlistForm.querySelector('button[type="submit"]');
      withPending(submitBtn, function () {
        return submitSignup(waitlistForm).then(function (ok) {
          if (!ok) {
            if (waitlistSuccess) {
              waitlistSuccess.hidden = false;
              waitlistSuccess.textContent = "Something went wrong — please try again or WhatsApp us.";
            }
            return;
          }
          waitlistForm.querySelectorAll("input, select").forEach(function (el) {
            if (el.type === "checkbox") el.checked = false;
            else el.value = "";
          });
          if (waitlistSuccess) {
            waitlistSuccess.textContent = "You're in — we'll let you know when new pieces drop.";
            waitlistSuccess.hidden = false;
          }
        });
      });
    });
  }

  /* ---------- Footer newsletter ---------- */
  var footerForm = document.getElementById("footerForm");
  var footerMsg = document.getElementById("footerMsg");
  if (footerForm) {
    footerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = footerForm.querySelector("input");
      if (!input.value || !input.checkValidity()) { input.focus(); return; }
      var submitBtn = footerForm.querySelector('button[type="submit"]');
      withPending(submitBtn, function () {
        return submitSignup(footerForm).then(function (ok) {
          if (!footerMsg) return;
          if (!ok) {
            footerMsg.textContent = "Something went wrong — please try again.";
            footerMsg.hidden = false;
            return;
          }
          input.value = "";
          footerMsg.textContent = "Thanks — you're on the list.";
          footerMsg.hidden = false;
        });
      });
    });
  }

  /* ---------- Scroll reveal (with per-group stagger) ---------- */
  var revealEls = document.querySelectorAll(
    ".section__head, .card, .tile, .feat, .highlight, .about, .waitlist, .promise__item, " +
    ".community__item, .look, .sizing, .faq__item, .shop-choice__card, .contact-card, .post-card"
  );
  // Stagger siblings that share a parent so grids cascade in nicely. Index is
  // the element's position among its reveal-siblings, capped so later items
  // don't lag too far behind.
  revealEls.forEach(function (el) {
    el.classList.add("reveal");
    var parent = el.parentNode;
    if (!parent) return;
    var i = parent.__revIdx || 0;
    el.style.setProperty("--reveal-i", Math.min(i, 6));
    parent.__revIdx = i + 1;
  });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Show persisted bag on load ---------- */
  renderBag();

  /* ---------- Active nav link on scroll ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__links a"));
  var sectionMap = {};
  navLinks.forEach(function (link) {
    var id = link.getAttribute("href");
    if (id && id.charAt(0) === "#" && id.length > 1) {
      var sec = document.querySelector(id);
      if (sec) sectionMap[id] = link;
    }
  });
  if ("IntersectionObserver" in window && Object.keys(sectionMap).length) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove("is-active"); });
          var active = sectionMap["#" + entry.target.id];
          if (active) active.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(sectionMap).forEach(function (id) {
      navIo.observe(document.querySelector(id));
    });
  }

  /* ---------- Back to top ---------- */
  var toTop = document.getElementById("toTop");
  if (toTop) {
    var onScroll = function () {
      var show = window.scrollY > 600;
      toTop.hidden = false;
      toTop.classList.toggle("is-visible", show);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
