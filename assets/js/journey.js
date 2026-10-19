/* Chapter engine for the home page: reports scroll progress, marks the chapter
   in view for the rail, and drives nothing else. The scene listens to the
   "journey" event; the header progress line is site.js, on every page. */
(function () {
  "use strict";

  var chapters = Array.prototype.slice.call(document.querySelectorAll("[data-chapter]"));
  if (!chapters.length) return;

  var railLinks = Array.prototype.slice.call(document.querySelectorAll(".chapter-rail a"));
  var current = -1;

  function update() {
    var vh = window.innerHeight;
    var y = window.scrollY || window.pageYOffset || 0;
    var max = document.documentElement.scrollHeight - vh;
    var progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;

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
        var isCurrent = index === active;
        link.classList.toggle("is-current", isCurrent);
        // The rail's colour alone should not be the only signal of "you are here".
        if (isCurrent) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    }

    document.dispatchEvent(
      new CustomEvent("journey", {
        detail: { progress: progress, active: active, count: chapters.length }
      })
    );
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
