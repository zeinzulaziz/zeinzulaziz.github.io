(function () {
  "use strict";

  const GITHUB_USER = "zeinzulaziz";
  const PROJECTS_MANIFEST = "content/projects.json";
  const CACHE_KEY = "projects.cache.v3";
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes, matches blog.js

  // Build-time project pages (tools/build.mjs), keyed by slug and repo name.
  let projectPages = {};

  const liveDemo = {
    "harga-pangan": "https://zeinzulaziz.github.io/harga-pangan/",
    "convert-gold": "https://zeinzulaziz.github.io/convert-gold/",
  };

  const titles = {
    "harga-pangan": "Food Prices",
    "convert-gold": "Convert Gold",
    invoice: "Invoice Generator",
  };

  const descriptions = {
    "harga-pangan": "Food producer price dashboard for East Java, built on SISKAPERBAPO data.",
    "convert-gold": "Gold price calculator to run quick numbers before trading.",
    invoice:
      "An invoice workspace for small businesses: build and manage invoices, " +
      "export PDFs, track payments, and keep a cloud backup. Firebase auth keeps " +
      "each workspace closed.",
  };

  /* Work with no public repository. content/repos.json only holds what the
     GitHub API returns (and CI rewrites it), so these live here instead.
     `private: true` drops the repo link and the star count; with no homepage
     the card also skips the demo link and the LIVE plate. */
  const ownedProjects = [
    {
      name: "invoice",
      language: "Firebase web app",
      stargazers_count: 0,
      description: null,
      homepage: null,
      private: true,
      screenshot: true,
    },
    {
      name: "wordpress",
      language: "WordPress",
      stargazers_count: 0,
      description: null,
      homepage: null,
      caseStudy: true,
      screenshot: false,
    },
  ];

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
        pages: Array.isArray(parsed.pages) ? parsed.pages : [],
        fresh: typeof parsed.time === "number" && Date.now() - parsed.time <= CACHE_TTL,
      };
    } catch (err) {
      return null;
    }
  }

  function writeCache(repos, pages) {
    if (cacheDisabled()) return;
    try {
      window.localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ time: Date.now(), repos: repos, pages: pages })
      );
    } catch (err) {
      /* storage full or blocked — cache is only a fast path */
    }
  }

  /* ---------- data ---------- */

  // content/repos.json is a build-time snapshot (tools/build-repos.mjs, kept
  // fresh by CI). Reading it same-origin avoids the unauthenticated GitHub
  // API limit of 60 req/hour per IP, which every first-time visitor used to
  // burn through together.
  function fetchRepos() {
    return fetch("content/repos.json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        const repos = Array.isArray(data) ? data : data && data.repos;
        if (!Array.isArray(repos)) throw new Error("Invalid response");
        return repos;
      });
  }

  function normalizeRepo(r) {
    return {
      name: r.name,
      language: r.language,
      stargazers_count: r.stargazers_count || 0,
      description: r.description,
      homepage: r.homepage,
      private: r.private === true,
      caseStudy: r.caseStudy === true,
      screenshot: r.screenshot === true,
    };
  }

  /* ---------- project pages (content/projects.json) ---------- */

  function indexProjectPages(list) {
    const map = {};
    (list || []).forEach(function (page) {
      if (!page || !page.slug) return;
      map[page.slug] = page;
      if (page.repo) map[page.repo] = page;
    });
    return map;
  }

  function projectPageList() {
    const list = [];
    const seen = {};
    Object.keys(projectPages).forEach(function (key) {
      const page = projectPages[key];
      if (page && !seen[page.slug]) {
        seen[page.slug] = true;
        list.push(page);
      }
    });
    return list;
  }

  function fetchProjectPages() {
    return fetch(PROJECTS_MANIFEST, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        const list = Array.isArray(data) ? data : data && data.projects;
        return Array.isArray(list) ? list : [];
      });
  }

  /* Curated work leads the list. If a curated project ever becomes a public
     repository, the GitHub entry wins so the card can link to it. */
  function allProjects(repos) {
    const names = new Set(repos.map(function (r) { return r.name; }));
    return ownedProjects.filter(function (p) { return !names.has(p.name); }).concat(repos);
  }

  function renderCard(repo, index) {
    const name = repo.name;
    const page = projectPages[name] || null;
    const pageHref = page ? "project/" + encodeURIComponent(page.slug) + "/" : null;
    const demo =
      liveDemo[name] || (page && page.demo) || (repo.homepage && repo.homepage.trim()) || null;
    const hasScreenshot = Boolean(liveDemo[name] || repo.screenshot || (page && page.cover));
    const isPrivate = repo.private === true || Boolean(page && page.private);
    // No repository to link to, but not private either: a case study page.
    const caseStudy =
      repo.caseStudy === true || Boolean(page && !page.repo && !page.private);
    const repoHref = isPrivate || caseStudy ? null : repoUrl(name);
    /* A private project still gets a clickable title, it just points at the
       project page or live product instead of a repository that outsiders
       cannot open. */
    const titleHref = pageHref || repoHref || demo;

    /* Featured row: real screenshot when we have one, letter plate otherwise.
       Plain rows get a small thumb only when a real screenshot exists. */
    const shotSrc = page && page.cover
      ? page.cover.replace(/^\//, "")
      : "assets/img/" + encodeURIComponent(name) + ".webp";
    const featuredPreview = hasScreenshot
      ? '<img src="' + escapeHtml(shotSrc) + '" alt="Preview ' + escapeHtml(name) + '" loading="lazy" decoding="async" width="640" height="360">'
      : '<div class="preview-placeholder" aria-hidden="true">' + escapeHtml(firstLetter(name)) + "</div>";

    const livePlate = demo ? '<span class="live-plate">LIVE</span>' : "";

    const links = (pageHref || repoHref || demo)
      ? '<p class="project-links">' +
        (pageHref ? '<a href="' + pageHref + '">Details</a>' : "") +
        (repoHref
          ? '<a href="' + repoHref + '" target="_blank" rel="noopener">Repo</a>'
          : "") +
        (demo ? '<a href="' + escapeHtml(demo) + '" target="_blank" rel="noopener">Demo</a>' : "") +
        "</p>"
      : "";

    const meta =
      '<p class="project-meta"><span class="project-lang">' + escapeHtml(repo.language || "N/A") + "</span>" +
      "<span>" + (isPrivate ? "Private" : caseStudy ? "Case study" : "★ " + (repo.stargazers_count || 0)) + "</span></p>";

    const label = page && page.title ? page.title : langBadge(name);
    const title = titleHref
      ? pageHref
        ? '<a href="' + pageHref + '">' + escapeHtml(label) + "</a>"
        : '<a href="' + escapeHtml(titleHref) + '" target="_blank" rel="noopener">' + escapeHtml(label) + "</a>"
      : escapeHtml(label);

    const desc =
      page && page.summary
        ? page.summary
        : lookUp(
            descriptions,
            name,
            repo.description || (isPrivate ? "Private project." : caseStudy ? "Case study." : "Public repository with no description.")
          );

    const main =
      '<div class="project-main">' +
      '<h3 class="project-title">' + title + "</h3>" +
      '<p class="project-desc">' + escapeHtml(desc) + "</p>" +
      "</div>";

    const card = document.createElement("article");
    card.className = "project-row reveal";
    card.style.setProperty("--d", (index * 50) + "ms");

    if (index === 0) {
      card.classList.add("is-featured");
      card.innerHTML =
        '<div class="project-media">' + featuredPreview + livePlate + "</div>" +
        main +
        '<div class="project-side">' + meta + links + "</div>";
    } else if (hasScreenshot) {
      card.innerHTML =
        '<div class="project-media"><img src="' + escapeHtml(shotSrc) + '" alt="" loading="lazy" decoding="async" width="640" height="400"></div>' +
        main +
        '<div class="project-side">' + meta + links + "</div>";
    } else {
      card.innerHTML =
        main +
        '<div class="project-side">' + meta + links + "</div>";
    }

    return card;
  }

  function showError(message) {
    const grid = document.getElementById("projectsGrid");
    if (!grid) return;
    /* Curated work does not depend on the API, so it still gets rendered. */
    renderAll([]);
    const note = document.createElement("div");
    note.className = "projects-loading";
    note.innerHTML =
      message + " " +
      '<a href="' + repoUrl("") + '" target="_blank" rel="noopener">See all repositories here</a>.';
    grid.appendChild(note);
  }

  function renderAll(repos) {
    const grid = document.getElementById("projectsGrid");
    if (!grid) return;
    grid.innerHTML = "";
    const projects = allProjects(repos);
    const fragment = document.createDocumentFragment();
    projects.forEach(function (repo, index) {
      fragment.appendChild(renderCard(normalizeRepo(repo), index));
    });
    grid.appendChild(fragment);
    grid.setAttribute("aria-busy", "false");
    const stat = document.getElementById("statProjects");
    if (stat) stat.textContent = String(projects.length);
    revealCards();
    // The page just got taller; let the scroll progress bar catch up.
    document.dispatchEvent(new CustomEvent("contentchange"));
  }

  function revealCards() {
    if (typeof window.observeReveals !== "function") return;
    const cards = document.querySelectorAll("#projectsGrid .reveal:not(.is-in)");
    if (cards.length) window.observeReveals(cards);
  }

  function fillGrid(repos) {
    renderAll(repos);
    writeCache(repos.map(normalizeRepo), projectPageList());
  }

  async function loadProjects() {
    const grid = document.getElementById("projectsGrid");
    if (!grid) return;

    const cached = readCache();

    // Project pages power the "Details" links. If the manifest is missing the
    // cards simply keep pointing at the repository or the live demo.
    try {
      projectPages = indexProjectPages(await fetchProjectPages());
    } catch (err) {
      projectPages = cached ? indexProjectPages(cached.pages) : {};
    }

    // Skeletons stay visible while we check the cache first.
    if (cached && cached.fresh) {
      renderAll(cached.repos);
    }

    try {
      const repos = await fetchRepos();
      fillGrid(repos);
    } catch (err) {
      if (cached) {
        renderAll(cached.repos); // stale cache beats an error message
      } else if (!grid.querySelector(".project-row")) {
        showError("Failed to load projects. Try reloading the page,");
      }
    }
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
        // Rect-based: the chapters sit inside a positioned parent, so
        // offsetTop would be measured from the wrong origin.
        if (section.getBoundingClientRect().top + window.scrollY <= fromTop) current = section.id;
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

  /* ---------- scroll reveal ---------- */

  function initReveals() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.getAttribute("data-motion") === "off";
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

    // Safety net. A rootMargin can keep an element that is already on screen
    // from ever intersecting, and a background tab can stall the transition.
    // Once the page has settled, anything sitting in the viewport is shown.
    function settle() {
      document.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) {
        var box = el.getBoundingClientRect();
        if (box.top < window.innerHeight && box.bottom > 0) el.classList.add("is-in");
      });
    }
    window.setTimeout(settle, 1500);
    window.addEventListener("load", function () { window.setTimeout(settle, 400); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadProjects();
    initScrollspy();
    initReveals();
  });
})();
