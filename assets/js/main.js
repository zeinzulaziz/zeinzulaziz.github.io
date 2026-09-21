(function () {
  "use strict";

  const GITHUB_USER = "zeinzulaziz";

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

  function renderCard(repo) {
    const name = repo.name;
    const demo = liveDemo[name] || (repo.homepage && repo.homepage.trim()) || null;
    const hasScreenshot = liveDemo[name] ? true : false;

    const preview = hasScreenshot
      ? '<img src="assets/img/' + encodeURIComponent(name) + '.png" alt="Preview ' + escapeHtml(name) + '" loading="lazy">'
      : '<div class="preview-placeholder">' + escapeHtml(firstLetter(name)) + "</div>";

    const badge = demo ? '<span class="preview-badge">LIVE</span>' : "";

    const links =
      '<div class="project-links">' +
      '<a href="' + repoUrl(name) + '" target="_blank" rel="noopener">Repo</a>' +
      (demo ? '<a href="' + demo + '" target="_blank" rel="noopener">Demo</a>' : "") +
      "</div>";

    const card = document.createElement("article");
    card.className = "project-card";

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
    grid.innerHTML =
      '<div class="projects-loading">' + message + " " +
      '<a href="' + repoUrl("") + '" target="_blank" rel="noopener">See all repositories here</a>.</div>';
  }

  async function loadProjects() {
    const grid = document.getElementById("projectsGrid");
    if (!grid) return;

    try {
      const res = await fetch("https://api.github.com/users/" + GITHUB_USER + "/repos?per_page=100&sort=updated");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const repos = await res.json();
      if (!Array.isArray(repos)) throw new Error("Respons tidak valid");

      const projects = repos
        .filter(function (r) {
          return !r.fork && r.name !== GITHUB_USER + ".github.io";
        })
        .sort(function (a, b) {
          return b.stargazers_count - a.stargazers_count || b.pushed_at.localeCompare(a.pushed_at);
        });

      if (projects.length === 0) {
        showError("No public repositories found yet.");
        return;
      }

      grid.innerHTML = "";
      const fragment = document.createDocumentFragment();
      projects.forEach(function (repo) {
        fragment.appendChild(renderCard(repo));
      });
      grid.appendChild(fragment);
    } catch (err) {
      showError("Failed to load projects. Try reloading the page,");
    }
  }

  function setYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadProjects();
    setYear();
  });
})();