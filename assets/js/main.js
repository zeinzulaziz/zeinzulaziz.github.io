(function () {
  "use strict";

  const GITHUB_USER = "zeinzulaziz";
  const CACHE_KEY = "projects.cache.v1";
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes, matches blog.js

  const liveDemo = {
    "harga-pangan": "https://zeinzulaziz.github.io/harga-pangan/",
    "convert-gold": "https://zeinzulaziz.github.io/convert-gold/",
    "record_your_money": "https://zeinzulaziz.github.io/record_your_money/",
    "broken-link-checker": "https://broken-link-checker-sepia.vercel.app",
  };

  const titles = {
    "record_your_money": "Record Your Money",
    "broken-link-checker": "Broken Link Checker",
    "harga-pangan": "Food Prices",
    "convert-gold": "Convert Gold",
    "Kiro-Project": "Kiro Project",
    "grafik-chart": "Chart Graph",
    "motorcycle-alarm-schematic": "Motorcycle Alarm Schematic",
  };

  const descriptions = {
    "harga-pangan": "Food producer price dashboard for East Java—SISKAPERBAPO data.",
    "convert-gold": "Gold price calculator to run quick numbers before trading.",
    "record_your_money": "A daily expense tracker, built with Flutter.",
    "broken-link-checker": "Find dead links on any site, straight from the browser.",
    "Kiro-Project": "A JavaScript experiment with no clear direction, let it be.",
    "grafik-chart": "Make charts and graphs quickly, so data looks good.",
    "motorcycle-alarm-schematic": "Motorcycle alarm circuit schematic (hardware).",
  };

  function lookUp(obj, name, fallback) {
    return Object.prototype.hasOwnProperty.call(obj, name) ? obj[name] : fallback;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function repoUrl(name) {
    return "https://github.com/" + GITHUB_USER + "/" + encodeURIComponent(name);
  }

  function firstLetter(name) {
    return name.charAt(0).toUpperCase();
  }

  function langBadge(name) {
    return lookUp(titles, name, name.replace(/[-_]/g, " "));
  }

  /* ---------- localStorage cache: fresh serve, stale fallback ---------- */

  function cacheDisabled() {
    return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname) ||
      /[?&]nocache\b/.test(window.location.search);
  }

  function readCache() {
    if (cacheDisabled()) return null;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "null");
      if (!parsed || !Array.isArray(parsed.repos)) return null;
      return {
        repos: parsed.repos,
        fresh: typeof parsed.time === "number" && Date.now() - parsed.time <= CACHE_TTL,
      };
    } catch (err) {
      return null;
    }
  }

  function writeCache(repos) {
    if (cacheDisabled()) return;
    try {
      window.localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ time: Date.now(), repos: repos })
      );
    } catch (err) {
      /* storage full or blocked — cache is only a fast path */
    }
  }

  /* ---------- data ---------- */

  function fetchRepos() {
    return fetch("https://api.github.com/users/" + GITHUB_USER + "/repos?per_page=100&sort=updated")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (repos) {
        if (!Array.isArray(repos)) throw new Error("Invalid response");
        return repos
          .filter(function (r) {
            return !r.fork && r.name !== GITHUB_USER + ".github.io";
          })
          .sort(function (a, b) {
            return b.stargazers_count - a.stargazers_count || String(b.pushed_at).localeCompare(String(a.pushed_at));
          });
      });
  }

  function normalizeRepo(r) {
    return {
      name: r.name,
      language: r.language,
      stargazers_count: r.stargazers_count || 0,
      description: r.description,
      homepage: r.homepage,
    };
  }

  function renderCard(repo, index) {
    const name = repo.name;
    const demo = liveDemo[name] || (repo.homepage && repo.homepage.trim()) || null;
    const hasScreenshot = Object.prototype.hasOwnProperty.call(liveDemo, name);

    const preview = hasScreenshot
      ? '<img src="assets/img/' + encodeURIComponent(name) + '.png" alt="Preview ' + escapeHtml(name) + '" loading="lazy" decoding="async" width="640" height="400">'
      : '<div class="preview-placeholder">' + escapeHtml(firstLetter(name)) + "</div>";

    const badge = demo ? '<span class="preview-badge">LIVE</span>' : "";

    const links =
      '<div class="project-links">' +
      '<a href="' + repoUrl(name) + '" target="_blank" rel="noopener">Repo</a>' +
      (demo ? '<a href="' + escapeHtml(demo) + '" target="_blank" rel="noopener">Demo</a>' : "") +
      "</div>";

    const card = document.createElement("article");
    card.className = "project-card reveal";
    card.style.setProperty("--d", (index * 60) + "ms");

    card.innerHTML =
      '<div class="project-preview">' + preview + badge + "</div>" +
      '<div class="project-body">' +
      '<h3 class="project-title"><a href="' + repoUrl(name) + '" target="_blank" rel="noopener">' + escapeHtml(langBadge(name)) + "</a></h3>" +
      '<p class="project-desc">' + escapeHtml(lookUp(descriptions, name, repo.description || "Public repository with no description.")) + "</p>" +
      '<div class="project-meta">' +
      '<span class="project-lang">' + escapeHtml(repo.language || "N/A") + "</span>" +
      "<span>★ " + (repo.stargazers_count || 0) + "</span>" +
      "</div>" +
      links +
      "</div>";

    return card;
  }

  function showError(message) {
    const grid = document.getElementById("projectsGrid");
    if (!grid) return;
    grid.innerHTML =
      '<div class="projects-loading">' + message + " " +
      '<a href="' + repoUrl("") + '" target="_blank" rel="noopener">See all repositories here</a>.</div>';
  }

  function renderAll(repos) {
    const grid = document.getElementById("projectsGrid");
    if (!grid) return;
    grid.innerHTML = "";
    const fragment = document.createDocumentFragment();
    repos.forEach(function (repo, index) {
      fragment.appendChild(renderCard(normalizeRepo(repo), index));
    });
    grid.appendChild(fragment);
    revealCards();
  }

  function revealCards() {
    if (typeof window.observeReveals !== "function") return;
    const cards = document.querySelectorAll("#projectsGrid .reveal:not(.is-in)");
    if (cards.length) window.observeReveals(cards);
  }

  function fillGrid(repos) {
    renderAll(repos);
    writeCache(repos.map(normalizeRepo));
  }

  async function loadProjects() {
    const grid = document.getElementById("projectsGrid");
    if (!grid) return;

    // Skeletons stay visible while we check the cache first.
    const cached = readCache();
    if (cached && cached.fresh) {
      renderAll(cached.repos);
    }

    try {
      const repos = await fetchRepos();
      fillGrid(repos);
    } catch (err) {
      if (cached) {
        renderAll(cached.repos); // stale cache beats an error message
      } else if (!grid.querySelector(".project-card")) {
        showError("Failed to load projects. Try reloading the page,");
      }
    }
  }

  function setYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------- scrollspy: highlight nav link of section in view ---------- */

  function initScrollspy() {
    const links = {};
    ["projects", "about", "contact"].forEach(function (id) {
      const link = document.querySelector('.nav-links a[href$="#' + id + '"]');
      if (link) links[id] = link;
    });
    const sections = Object.keys(links)
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);
    if (!sections.length) return;

    function pick() {
      const fromTop = window.scrollY + 90;
      let current = null;
      sections.forEach(function (section) {
        if (section.offsetTop <= fromTop) current = section.id;
      });
      Object.keys(links).forEach(function (id) {
        links[id].classList.toggle("is-active", id === current);
      });
    }

    let ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        pick();
        ticking = false;
      });
    }, { passive: true });
    pick();
  }

  function initHeaderShadow() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    let ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
        ticking = false;
      });
    }, { passive: true });
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  /* ---------- scroll reveal ---------- */

  function initReveals() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { io.observe(el); });
    window.observeReveals = function (extra) {
      (extra || document.querySelectorAll(".reveal:not(.is-in)")).forEach(function (el) {
        io.observe(el);
      });
    };
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadProjects();
    setYear();
    initScrollspy();
    initHeaderShadow();
    initReveals();
  });
})();
