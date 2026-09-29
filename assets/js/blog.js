(function () {
  "use strict";

  const CACHE_KEY = "blog.index.v1";
  const CACHE_TTL = 10 * 60 * 1000;

  const REPO = "zeinzulaziz/zeinzulaziz.github.io";
  const BRANCH = "main";
  const POSTS_DIR = "content/posts";
  const MANIFEST = "content/posts.json";
  const RAW_BASE =
    "https://raw.githubusercontent.com/" + REPO + "/" + BRANCH + "/" + POSTS_DIR + "/";

  /* ---------- utilities ---------- */

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isLocalHost() {
    return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
  }

  function readCache() {
    if (isLocalHost() || /[?&]nocache\b/.test(window.location.search)) return null;
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.time !== "number") return null;
      if (Date.now() - parsed.time > CACHE_TTL) return null;
      return Array.isArray(parsed.posts) ? parsed.posts : null;
    } catch (err) {
      return null;
    }
  }

  function writeCache(posts) {
    if (isLocalHost() || /[?&]nocache\b/.test(window.location.search)) return;
    try {
      window.localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ time: Date.now(), posts: posts })
      );
    } catch (err) {
      /* storage penuh atau diblokir — abaikan, cache hanya bonus */
    }
  }

  function parseFrontmatter(raw) {
    const text = String(raw || "").replace(/^﻿/, "").replace(/\r\n?/g, "\n");
    const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!match) return { data: {}, body: text };

    const data = {};
    match[1].split("\n").forEach(function (line) {
      const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
      if (!kv) return;
      const key = kv[1].toLowerCase();
      let value = kv[2].trim();

      if (/^".*"$|^'.*'$/.test(value)) value = value.slice(1, -1);
      if (value === "true") value = true;
      else if (value === "false") value = false;
      else if (value.startsWith("[") && value.endsWith("]")) {
        value = value
          .slice(1, -1)
          .split(",")
          .map(function (item) {
            return item.trim().replace(/^["']|["']$/g, "");
          })
          .filter(Boolean);
      }

      data[key] = value;
    });

    return { data: data, body: text.slice(match[0].length) };
  }

  function toArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string" || !value.trim()) return [];
    return value.split(",").map(function (t) {
      return t.trim();
    }).filter(Boolean);
  }

  function slugify(value) {
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function normalize(raw, fallbackSlug) {
    const parsed = parseFrontmatter(raw);
    const d = parsed.data;
    const slug = String(d.slug || fallbackSlug || "").trim();
    const title = d.title || slug.replace(/-/g, " ");

    return {
      slug: slug,
      title: title,
      date: d.date || "",
      description: d.description || d.summary || "",
      tags: toArray(d.tags),
      type: d.type === "note" ? "note" : "article",
      draft: d.draft === true || d.published === false,
      body: parsed.body,
      url: "post.html?slug=" + encodeURIComponent(slug),
    };
  }

  function readingTime(body) {
    const words = (String(body || "").replace(/```[\s\S]*?```/g, " ").match(/\S+/g) || []).length;
    return Math.max(1, Math.round(words / 200));
  }

  /* ---------- data layer ---------- */

  function fetchText(url) {
    return fetch(url, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status + " — " + url);
      return res.text();
    });
  }

  function listRemoteFiles() {
    const url =
      "https://api.github.com/repos/" + REPO +
      "/contents/" + POSTS_DIR + "?ref=" + BRANCH;
    return fetch(url, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) throw new Error("Daftar post tidak valid");
        return data
          .filter(function (item) {
            return item.type === "file" && /\.md$/i.test(item.name) && item.name.charAt(0) !== "_";
          })
          .map(function (item) {
            return {
              slug: item.name.replace(/\.md$/i, ""),
              url: item.download_url || RAW_BASE + item.name,
            };
          });
      });
  }

  function loadManifest() {
    return fetch(MANIFEST, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }).then(function (data) {
      const list = Array.isArray(data) ? data : data && data.posts;
      if (!Array.isArray(list)) throw new Error("Manifest tidak valid");
      return list;
    });
  }

  function loadPosts() {
    const cached = readCache();
    if (cached) return Promise.resolve(cached);

    return Promise.all([
      loadManifest().catch(function () {
        return [];
      }),
      listRemoteFiles().catch(function () {
        return [];
      }),
    ])
      .then(function (results) {
        const manifest = results[0];
        const remote = results[1];
        const bySlug = {};

        manifest.forEach(function (entry) {
          if (!entry || !entry.slug) return;
          bySlug[entry.slug] = {
            slug: entry.slug,
            title: entry.title || entry.slug,
            date: entry.date || "",
            description: entry.description || "",
            tags: toArray(entry.tags),
            type: entry.type === "note" ? "note" : "article",
            draft: entry.draft === true,
            readingTime: entry.readingTime || 0,
            url: "post.html?slug=" + encodeURIComponent(entry.slug),
          };
        });

        const missing = remote.filter(function (file) {
          return !bySlug[file.slug];
        });

        return Promise.all(
          missing.map(function (file) {
            return fetchText(file.url)
              .then(function (raw) {
                return normalize(raw, file.slug);
              })
              .catch(function () {
                return null;
              });
          })
        ).then(function (fetched) {
          fetched.forEach(function (post) {
            if (post && post.slug && !bySlug[post.slug]) bySlug[post.slug] = post;
          });

          const list = Object.keys(bySlug)
            .map(function (key) {
              return bySlug[key];
            })
            .filter(function (post) {
              return !post.draft;
            })
            .sort(function (a, b) {
              return String(b.date).localeCompare(String(a.date));
            });

          if (!list.length) throw new Error("Belum ada artikel");
          writeCache(list);
          return list;
        });
      });
  }

  function loadPost(slug) {
    if (!slug) return Promise.reject(new Error("Slug artikel tidak ditemukan"));

    const local = POSTS_DIR + "/" + encodeURIComponent(slug) + ".md";
    const remote = RAW_BASE + encodeURIComponent(slug) + ".md";

    return fetchText(local)
      .catch(function () {
        return fetchText(remote);
      })
      .then(function (raw) {
        const post = normalize(raw, slug);
        post.readingTime = readingTime(post.body);
        return post;
      });
  }

  /* ---------- rendering ---------- */

  function postCard(post) {
    const meta =
      '<div class="post-meta">' +
      (post.date ? "<span>" + escapeHtml(formatDate(post.date)) + "</span>" : "") +
      (post.readingTime ? "<span>" + post.readingTime + " min read</span>" : "") +
      "</div>";

    const tags = post.tags.length
      ? '<div class="post-tags">' + post.tags.map(function (tag) {
          return "<span>" + escapeHtml(tag) + "</span>";
        }).join("") + "</div>"
      : "";

    return (
      '<article class="post-card' + (post.type === "note" ? " is-note" : "") + '">' +
      meta +
      '<h2 class="post-card-title"><a href="' + escapeHtml(post.url) + '">' + escapeHtml(post.title) + "</a></h2>" +
      (post.description ? '<p class="post-card-desc">' + escapeHtml(post.description) + "</p>" : "") +
      tags +
      "</article>"
    );
  }

  function renderList(posts) {
    const grid = document.getElementById("blogList");
    if (!grid) return;

    if (!posts.length) {
      grid.innerHTML = '<p class="blog-empty">No articles yet. Check back soon.</p>';
      return;
    }

    const notes = posts.filter(function (p) {
      return p.type === "note";
    }).length;
    const articles = posts.length - notes;

    document.getElementById("blogCount").textContent =
      articles + (articles === 1 ? " article" : " articles") +
      " · " + notes + (notes === 1 ? " note" : " notes");

    grid.innerHTML = posts
      .map(function (post) {
        if (!post.readingTime) post.readingTime = readingTime(post.body);
        return postCard(post);
      })
      .join("");
  }

  function renderSingle(post) {
    const root = document.getElementById("postRoot");
    if (!root) return;

    document.title = post.title + " — Moh Zein Zulfanul Aziz";
    const desc = document.querySelector('meta[name="description"]');
    if (desc && post.description) desc.setAttribute("content", post.description);

    const tags = post.tags.length
      ? '<div class="post-tags">' + post.tags.map(function (tag) {
          return "<span>" + escapeHtml(tag) + "</span>";
        }).join("") + "</div>"
      : "";

    const meta =
      '<div class="post-meta">' +
      (post.date ? "<span>" + escapeHtml(formatDate(post.date)) + "</span>" : "") +
      (post.readingTime ? "<span>" + post.readingTime + " min read</span>" : "") +
      "</div>";

    root.innerHTML =
      '<a class="post-back" href="blog.html">&larr; All posts</a>' +
      "<article>" +
      '<h1 class="post-title">' + escapeHtml(post.title) + "</h1>" +
      meta +
      tags +
      '<div class="prose">' + window.MiniMarkdown.render(post.body) + "</div>" +
      "</article>";

    root.hidden = false;
    const loader = document.getElementById("postLoading");
    if (loader) loader.hidden = true;
  }

  function showPostError(message) {
    const loader = document.getElementById("postLoading");
    if (loader) {
      loader.innerHTML = '<p class="blog-empty">' + escapeHtml(message) + "</p>";
    }
  }

  function initList() {
    if (!document.getElementById("blogList")) return;

    loadPosts()
      .then(renderList)
      .catch(function (err) {
        const grid = document.getElementById("blogList");
        grid.innerHTML =
          '<p class="blog-empty">Gagal memuat artikel (' + escapeHtml(err.message) +
          "). Coba muat ulang halaman.</p>";
      });
  }

  function initSingle() {
    if (!document.getElementById("postRoot")) return;

    const slug = new URLSearchParams(window.location.search).get("slug");
    if (!slug) {
      showPostError("Artikel tidak ditemukan.");
      return;
    }

    loadPost(slug)
      .then(renderSingle)
      .catch(function () {
        showPostError("Gagal memuat artikel. Coba muat ulang halaman.");
      });
  }

  function setYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  document.addEventListener("DOMContentLoaded", function () {
    initList();
    initSingle();
    setYear();
  });

  window.BlogData = {
    loadPosts: loadPosts,
    loadPost: loadPost,
    parseFrontmatter: parseFrontmatter,
    slugify: slugify,
  };
})();
