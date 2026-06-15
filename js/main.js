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
  var bag = [];                                            // [{name, price, qty}]
  var bagBtn = document.getElementById("bagBtn");
  var bagCount = document.getElementById("bagCount");
  var drawer = document.getElementById("bagDrawer");
  var overlay = document.getElementById("drawerOverlay");
  var drawerClose = document.getElementById("drawerClose");
  var drawerBody = document.getElementById("drawerBody");
  var drawerTotal = document.getElementById("drawerTotal");
  var checkoutBtn = document.getElementById("checkoutBtn");

  function money(n) { return "S$" + n.toFixed(2); }

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
      return (
        '<div class="bag-item">' +
          '<div class="bag-item__thumb ph ph--tone-oat"></div>' +
          '<div class="bag-item__info">' +
            '<div class="bag-item__name">' + item.name + '</div>' +
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

  function addToBag(name, price) {
    var existing = bag.find(function (i) { return i.name === name; });
    if (existing) { existing.qty += 1; }
    else { bag.push({ name: name, price: price, qty: 1 }); }
    renderBag();
    openDrawer();
  }

  // Wire up "Add to bag" buttons on product cards
  document.querySelectorAll(".add-to-bag").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest(".card");
      if (!card) return;
      addToBag(card.dataset.name, parseFloat(card.dataset.price));
    });
  });

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
    ".section__head, .card, .tile, .feat, .highlight, .about, .waitlist, .promise__item, .community__item"
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
})();
