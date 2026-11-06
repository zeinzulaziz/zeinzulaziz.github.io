/* Chapter engine for the home page: marks the chapter in view for the chapter
   rail, and keeps the CSS hooks that fade the scroll cue and the stand-in
   eclipse in step. The WebGL scene is gone; what remains is pure state, and all
   motion still lives in CSS. */
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
