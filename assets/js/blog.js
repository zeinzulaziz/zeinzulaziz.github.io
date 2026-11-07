/* Single-article loader for post.html — the fallback for old ?slug= links.
   Articles are prerendered at post/<slug>/ by tools/build.mjs, and the blog
   index is prerendered into blog.html, so the list no longer needs a renderer
   at runtime. This file only exists so a link written before the prerendered
   pages still resolves, and it points every signal at the canonical page. */
(function () {
  "use strict";

  const REPO = "zeinzulaziz/zeinzulaziz.github.io";
  const BRANCH = "main";
  const POSTS_DIR = "content/posts";
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

  // The canonical article URL is the prerendered page built by tools/build.mjs.
  function postUrl(slug) {
    return "post/" + encodeURIComponent(slug) + "/";
  }

  function parseFrontmatter(raw) {
    const text = String(raw || "").replace(/^﻿/, "").replace(/\r\n?/g, "\n");
    const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!match) return { data: {}, body: text };

    const data = {};
    const lines = match[1].split("\n");
    for (let i = 0; i < lines.length; i++) {
      const kv = lines[i].match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
      if (!kv) continue;
      const key = kv[1].toLowerCase();
      let value = kv[2].trim();

      if (value === "") {
        // List YAML multi-line (format output CMS): kumpulkan baris "- item".
        const items = [];
        let j = i + 1;
        while (j < lines.length && /^\s*-\s+/.test(lines[j])) {
          items.push(lines[j].replace(/^\s*-\s+/, "").trim().replace(/^["']|["']$/g, ""));
          j++;
        }
        if (items.length) {
          data[key] = items;
          i = j - 1;
          continue;
        }
      }

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
    }

    return { data: data, body: text.slice(match[0].length) };
  }

  function toArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string" || !value.trim()) return [];
    return value
      .split(",")
      .map(function (t) {
        return t.trim();
      })
      .filter(Boolean);
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
      body: parsed.body,
      url: postUrl(slug),
    };
  }

  function readingTime(body) {
    const words = (String(body || "").replace(/```[\s\S]*?```/g, " ").match(/\S+/g) || []).length;
    return Math.max(1, Math.round(words / 200));
  }

  /* ---------- data ---------- */

  function fetchText(url) {
    return fetch(url, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status + " — " + url);
      return res.text();
    });
  }

  function listRemoteFiles() {
    const url =
      "https://api.github.com/repos/" + REPO + "/contents/" + POSTS_DIR + "?ref=" + BRANCH;
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

  // Frontmatter slug can differ from the file name on older articles. Filename
  // is the identity that actually exists in the repo, so it wins as the URL.
  function findByFrontmatterSlug(slug) {
    return listRemoteFiles().then(function (files) {
      return Promise.all(
        files
          .filter(function (file) {
            return file.slug !== slug;
          })
          .map(function (file) {
            return fetchText(file.url)
              .then(function (raw) {
                const parsed = parseFrontmatter(raw);
                return String(parsed.data.slug || "").trim() === slug
                  ? normalize(raw, file.slug)
                  : null;
              })
              .catch(function () {
                return null;
              });
          })
      ).then(function (posts) {
        const found = posts.filter(Boolean)[0];
        if (!found) throw new Error("Artikel tidak ditemukan");
        return found;
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
      })
      .catch(function () {
        return findByFrontmatterSlug(slug).then(function (post) {
          post.readingTime = readingTime(post.body);
          return post;
        });
      });
  }

  /* ---------- rendering ---------- */

  function setMeta(attr, key, content) {
    if (!content) return;
    var el = document.querySelector('meta[' + attr + '="' + key + '"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function renderSingle(post) {
    var root = document.getElementById("postRoot");
    if (!root) return;

    document.title = post.title + " · Ze.in";
    var desc = document.querySelector('meta[name="description"]');
    if (desc && post.description) desc.setAttribute("content", post.description);

    // This page is only a fallback for old ?slug= links; point every signal
    // at the canonical prerendered page so shares and indexing converge there.
    var canonical = new URL(postUrl(post.slug), window.location.origin).href;
    var link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);
    setMeta("property", "og:title", post.title);
    setMeta("property", "og:description", post.description);
    setMeta("property", "og:url", canonical);

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

  function initSingle() {
    if (!document.getElementById("postRoot")) return;

    const slug = new URLSearchParams(window.location.search).get("slug");
    if (!slug) {
      showPostError("No post was specified.");
      return;
    }

    loadPost(slug)
      .then(renderSingle)
      .catch(function () {
        showPostError("Could not load this post. Try reloading the page.");
      });
  }

  document.addEventListener("DOMContentLoaded", initSingle);
})();
