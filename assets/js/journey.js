/* Fallback chapter state for the home page. Modern browsers do this in CSS:
   each chapter declares a view timeline, timeline-scope lifts the names to the
   document, and the rail, the nav and the scroll cue read them. index.html only
   loads this file when CSS.supports() says those timelines are missing, so the
   work here is the old scroll-position read, kept as the safety net. */
(function () {
  "use strict";

  var chapters = Array.prototype.slice.call(document.querySelectorAll("[data-chapter]"));
  if (!chapters.length) return;

  var railLinks = Array.prototype.slice.call(document.querySelectorAll(".chapter-rail a"));
  var current = -1;

  function update() {
    var vh = window.innerHeight;

    // Read every box before writing, so the loop never interleaves
    // layout reads with style writes.
    var boxes = chapters.map(function (chapter) {
      var rect = chapter.getBoundingClientRect();
      return { top: rect.top, height: rect.height };
    });

    var active = 0;
    var nearest = Infinity;

    boxes.forEach(function (box, index) {
      var middle = box.top + box.height / 2;
      var distance = Math.abs(middle - vh / 2);
      if (distance < nearest) {
        nearest = distance;
        active = index;
      }
    });

    if (active !== current) {
      current = active;
      // The scroll cue belongs to the opening chapter only.
      document.documentElement.setAttribute("data-chapter-active", chapters[active].id);
      railLinks.forEach(function (link, index) {
        link.classList.toggle("is-current", index === active);
      });
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      update();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  window.addEventListener("load", update);
  update();
})();
