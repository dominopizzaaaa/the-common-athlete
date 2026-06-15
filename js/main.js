/* ==========================================================================
   The Common Athlete — main.js
   Mobile menu, bag drawer, waitlist forms, and scroll reveal.
   No dependencies. Vanilla JS.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Current year in footer ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile menu toggle ---------- */
  var burger = document.getElementById("burger");
  var mobileMenu = document.getElementById("mobileMenu");

  function closeMobileMenu() {
    if (!burger || !mobileMenu) return;
    burger.classList.remove("is-open");
    mobileMenu.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
  }

  if (burger && mobileMenu) {
    burger.addEventListener("click", function () {
      var open = mobileMenu.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      mobileMenu.setAttribute("aria-hidden", String(!open));
    });
    // Close menu when a link is tapped
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMobileMenu);
    });
  }

  /* ---------- Bag / cart drawer ---------- */
  var STORAGE_KEY = "tca_bag";
  var bag = loadBag();                                     // [{name, price, img, size, qty}]
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
    catch (e) { /* storage unavailable — ignore */ }
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

  // Single-select size pills
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

  // Wire up "Add to bag" buttons on product cards
  document.querySelectorAll(".add-to-bag").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest(".card");
      if (!card) return;
      var group = card.querySelector(".sizes");
      var size = selectedSize(card);
      if (group && !size) { requireSize(group); return; }
      addToBag(card.dataset.name, parseFloat(card.dataset.price), card.dataset.img, size);
    });
  });

  // "Add set to bag" — the Everyday Set bundle
  var addSetBtn = document.querySelector(".add-set");
  if (addSetBtn) {
    addSetBtn.addEventListener("click", function () {
      var scope = document.querySelector(".set-buy");
      if (!scope) return;
      var group = scope.querySelector(".sizes");
      var size = selectedSize(scope);
      if (group && !size) { requireSize(group); return; }
      addToBag(scope.dataset.name, parseFloat(scope.dataset.price), scope.dataset.img, size);
    });
  }

  // Quantity / remove controls (event delegation)
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
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeDrawer(); closeMobileMenu(); }
  });

  /* ---------- Swatch selection (visual only) ---------- */
  document.querySelectorAll(".swatches").forEach(function (group) {
    group.addEventListener("click", function (e) {
      var sw = e.target.closest(".sw");
      if (!sw) return;
      group.querySelectorAll(".sw").forEach(function (s) {
        s.style.outline = "";
        s.style.outlineOffset = "";
      });
      sw.style.outline = "1.5px solid var(--text)";
      sw.style.outlineOffset = "2px";
    });
  });

  /* ---------- Waitlist form ---------- */
  var waitlistForm = document.getElementById("waitlistForm");
  var waitlistSuccess = document.getElementById("waitlistSuccess");
  if (waitlistForm) {
    waitlistForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = waitlistForm.querySelector("#email");
      if (!email.value || !email.checkValidity()) {
        email.focus();
        return;
      }
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
      waitlistForm.querySelectorAll("input, select, button").forEach(function (el) {
        if (el.type !== "submit") el.value = el.type === "checkbox" ? el.value : "";
        if (el.type === "checkbox") el.checked = false;
      });
      if (waitlistSuccess) waitlistSuccess.hidden = false;
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
      input.value = "";
      if (footerMsg) footerMsg.hidden = false;
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

  /* ---------- Countdown to launch ---------- */
  var countdown = document.getElementById("countdown");
  if (countdown) {
    var target = new Date(countdown.getAttribute("data-launch")).getTime();
    var fields = {
      days: countdown.querySelector('[data-cd="days"]'),
      hours: countdown.querySelector('[data-cd="hours"]'),
      mins: countdown.querySelector('[data-cd="mins"]'),
      secs: countdown.querySelector('[data-cd="secs"]')
    };
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var tick = function () {
      var diff = target - Date.now();
      if (diff <= 0) {
        fields.days.textContent = fields.hours.textContent =
          fields.mins.textContent = fields.secs.textContent = "00";
        clearInterval(timer);
        return;
      }
      var s = Math.floor(diff / 1000);
      fields.days.textContent = pad(Math.floor(s / 86400));
      fields.hours.textContent = pad(Math.floor((s % 86400) / 3600));
      fields.mins.textContent = pad(Math.floor((s % 3600) / 60));
      fields.secs.textContent = pad(s % 60);
    };
    tick();
    var timer = setInterval(tick, 1000);
  }

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
