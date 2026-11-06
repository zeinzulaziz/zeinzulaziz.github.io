(function () {
  "use strict";

  var root = document.documentElement;
  var THEME_COLORS = { light: "#ede6d9", dark: "#080d16" };

  // Privacy-friendly analytics (GoatCounter: no cookies, no personal data).
  // Set your site code from goatcounter.com to enable; empty string disables.
  var ANALYTICS = "";

  function initAnalytics() {
    if (!ANALYTICS) return;
    var s = document.createElement("script");
    s.defer = true;
    s.dataset.goatcounter = "https://" + ANALYTICS + ".goatcounter.com/count";
    s.src = "//gc.zgo.at/count.js";
    document.head.appendChild(s);
  }

  /* ---------- theme ---------- */

  function currentTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function applyTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLORS[theme]);
    var btn = document.querySelector(".theme-toggle");
    if (btn) {
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }
    // The scene paints from the CSS tokens, so it needs a repaint on switch.
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: theme } }));
    if (persist) {
      try {
        window.localStorage.setItem("theme", theme);
      } catch (err) {
        /* storage blocked: the choice just will not persist */
      }
    }
  }

  function initTheme() {
    var btn = document.querySelector(".theme-toggle");
    if (!btn) return;
    applyTheme(currentTheme(), false);
    btn.addEventListener("click", function () {
      applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
    });
  }

  /* ---------- motion control ---------- */

  function motionReduced() {
    return root.getAttribute("data-motion") === "off";
  }

  function applyMotion(reduced, persist) {
    root.setAttribute("data-motion", reduced ? "off" : "on");
    var btn = document.querySelector(".motion-toggle");
    if (btn) {
      var label = btn.querySelector(".control-label") || btn;
      label.textContent = reduced ? "Motion off" : "Motion on";
      btn.setAttribute("aria-label", reduced ? "Turn motion on" : "Turn motion off");
    }
    document.dispatchEvent(new CustomEvent("motionchange", { detail: { reduced: reduced } }));
    if (persist) {
      try {
        window.localStorage.setItem("motion", reduced ? "off" : "on");
      } catch (err) {
        /* storage blocked: the choice just will not persist */
      }
    }
  }

  function initMotion() {
    var btn = document.querySelector(".motion-toggle");
    if (!btn) return;
    applyMotion(motionReduced(), false);
    btn.addEventListener("click", function () {
      applyMotion(!motionReduced(), true);
    });
  }

  /* ---------- mobile nav ---------- */

  function initNav() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.getElementById("nav-menu");
    if (!header || !toggle || !menu) return;

    function setOpen(open) {
      header.setAttribute("data-menu", open ? "open" : "closed");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      var label = toggle.querySelector(".control-label") || toggle;
      label.textContent = open ? "Close" : "Menu";
    }

    setOpen(false);

    toggle.addEventListener("click", function () {
      setOpen(header.getAttribute("data-menu") !== "open");
    });

    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && header.getAttribute("data-menu") === "open") {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  function setYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function init() {
    initTheme();
    initMotion();
    initNav();
    setYear();
    initAnalytics();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
