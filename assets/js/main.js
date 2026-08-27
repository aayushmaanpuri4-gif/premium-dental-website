(function () {
  "use strict";

  /* Sticky header on scroll */
  var header = document.getElementById("siteHeader");
  var backToTop = document.getElementById("backToTop");

  function onScroll() {
    var scrolled = window.scrollY > 40;
    if (header) header.classList.toggle("scrolled", scrolled);
    if (backToTop) backToTop.classList.toggle("show", window.scrollY > 600);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* Mobile nav drawer */
  var menuToggle = document.getElementById("menuToggle");
  var mobileNav = document.getElementById("mobileNav");
  var mobileNavClose = document.getElementById("mobileNavClose");

  function openMenu() {
    if (mobileNav) {
      mobileNav.classList.add("open");
      mobileNav.setAttribute("aria-hidden", "false");
    }
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    if (mobileNav) {
      mobileNav.classList.remove("open");
      mobileNav.setAttribute("aria-hidden", "true");
    }
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  if (menuToggle) menuToggle.addEventListener("click", openMenu);
  if (mobileNavClose) mobileNavClose.addEventListener("click", closeMenu);
  if (mobileNav) {
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mobileNav && mobileNav.classList.contains("open")) closeMenu();
  });

  /* Reveal on scroll */
  var revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* Footer year */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Appointment form (front-end only placeholder — no backend configured) */
  var form = document.getElementById("appointmentForm");
  var success = document.getElementById("formSuccess");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (success) {
        success.classList.add("show");
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      form.reset();
    });
  }
})();
