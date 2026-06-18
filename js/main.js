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
    var heroT = setTimeout(revealHero, 2750);
    var cleanupT = setTimeout(function () {
      finished = true;
      body.classList.remove("intro-active");
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }, 4100);
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

  function money(n) { return "S$" + n.toFixed(2); }

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

    if (!drawerBody) return;
    if (bag.length === 0) {
      drawerBody.innerHTML = '<p class="drawer__empty">Your bag is empty.</p>';
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
    openDrawer();
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

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(
    ".section__head, .card, .tile, .feat, .highlight, .about, .waitlist, .promise__item, " +
    ".community__item, .look, .sizing, .faq__item"
  );
  revealEls.forEach(function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
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
