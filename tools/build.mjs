// Build-time generator. Runs locally (node tools/build.mjs) and in CI.
// Outputs:
//   content/posts.json          — metadata manifest (JSON export)
//   content/projects.json       — metadata manifest (JSON export)
//   post/<slug>/index.html      — prerendered article (shareable, indexable)
//   project/<slug>/index.html   — prerendered project page
//   index.html                  — project cards between the projects: markers
//   blog.html                   — post list between the posts: markers
//   sitemap.xml                 — index, blog, every published article
//   feed.xml                    — Atom feed of published articles
// The home page and the blog index are rendered here, so no visitor has to
// fetch a manifest or boot a renderer to see the work. Drafts never leave this
// script: no card, no page, no sitemap entry, no feed entry.
import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://zeinzulaziz.github.io";
const AUTHOR = "Ze.in";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const postsDir = join(root, "content", "posts");
const postsOut = join(root, "content", "posts.json");
const pagesDir = join(root, "post");

/* ---------- markdown: reuse the exact renderer the site ships ---------- */
const mdSource = await readFile(join(root, "assets", "js", "markdown.js"), "utf8");
const MiniMarkdown = new Function("window", mdSource + "\n;return window.MiniMarkdown;")({});

/* Intrinsic size for the cover image, so the prerendered page can reserve the
   space before the screenshot loads. Only the formats the covers use. */
async function imageSize(file) {
  let buf;
  try {
    buf = await readFile(file);
  } catch {
    return null;
  }
  if (buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const kind = buf.toString("ascii", 12, 16);
    if (kind === "VP8 ") {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (kind === "VP8L") {
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (kind === "VP8X") {
      return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
    }
  }
  if (buf.length > 24 && buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  return null;
}

/* ---------- frontmatter ---------- */
function parseFrontmatter(raw) {
  const text = String(raw).replace(/^﻿/, "").replace(/\r\n?/g, "\n");
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
      value = value.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    }
    data[key] = value;
  }
  return { data, body: text.slice(match[0].length) };
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function readingTime(body) {
  const words = (String(body).replace(/```[\s\S]*?```/g, " ").match(/\S+/g) || []).length;
  return Math.max(1, Math.round(words / 200));
}

function excerpt(body, limit = 180) {
  const plain = String(body)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > limit ? plain.slice(0, limit).replace(/\s+\S*$/, "") + "…" : plain;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Deterministic formatting from the frontmatter string, no timezone drift.
function formatDate(value) {
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(value || "");
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeXml(str) {
  return escapeHtml(str).replace(/'/g, "&apos;");
}

/* Widths produced by tools/build-images.mjs. Only the files that exist are
   advertised, so a screenshot added without running that script still works —
   it just falls back to the original. */
const IMG_WIDTHS = [200, 400, 800, 1200, 1600];

function srcsetFor(base, widths = IMG_WIDTHS, prefix = "") {
  const parts = [];
  for (const width of widths) {
    const file = `${base}-${width}.webp`;
    if (existsSync(join(root, file))) parts.push(`${prefix}${file} ${width}w`);
  }
  return parts.join(", ");
}

// srcset is useless without sizes; omit both rather than emit half of the pair.
function imageAttrs(base, sizes, widths = IMG_WIDTHS) {
  const set = srcsetFor(base, widths);
  return set ? ` srcset="${escapeHtml(set)}" sizes="${sizes}"` : "";
}


/* ---------- read posts ---------- */
const files = (await readdir(postsDir, { withFileTypes: true }))
  .filter((e) => e.isFile() && /\.md$/i.test(e.name) && e.name[0] !== "_")
  .map((e) => e.name);

const posts = [];
for (const file of files) {
  const raw = await readFile(join(postsDir, file), "utf8");
  const { data, body } = parseFrontmatter(raw);
  const slug = file.replace(/\.md$/i, "");
  posts.push({
    slug,
    title: data.title || slug.replace(/-/g, " "),
    date: data.date ? String(data.date).slice(0, 10) : "",
    description: data.description || data.summary || excerpt(body),
    tags: toArray(data.tags),
    type: data.type === "note" ? "note" : "article",
    draft: data.draft === true || data.published === false,
    cover: typeof data.cover === "string" ? data.cover.trim() : "",
    readingTime: readingTime(body),
    body,
  });
}

posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
const published = posts.filter((p) => !p.draft);

/* A manifest timestamp only changes when its contents do; otherwise every
   scheduled build would produce a no-op commit just for `generated`. */
async function writeManifest(file, key, items) {
  let generated = new Date().toISOString();
  try {
    const prev = JSON.parse(await readFile(file, "utf8"));
    if (JSON.stringify(prev[key]) === JSON.stringify(items)) generated = prev.generated || generated;
  } catch {
    /* no previous manifest, or unreadable: write a fresh one */
  }
  await writeFile(file, JSON.stringify({ generated, [key]: items }, null, 2) + "\n", "utf8");
}

/* ---------- 1. manifest ---------- */
// Body stays out of the manifest: blog.js only needs metadata, and the raw
// markdown is fetched per post when someone actually opens one.
await writeManifest(postsOut, "posts", posts.map(({ body, ...meta }) => meta));

/* ---------- 2. prerendered article pages ---------- */
function postUrl(slug) {
  return `${SITE}/post/${slug}/`;
}

function postImage(post) {
  if (post.cover) return post.cover.startsWith("/") ? SITE + post.cover : SITE + "/" + post.cover;
  return `${SITE}/assets/img/og.jpg`;
}

function articleJsonLd(post) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date ? `${post.date}T00:00:00+07:00` : undefined,
    author: { "@type": "Person", name: AUTHOR, url: SITE + "/" },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl(post.slug) },
    image: postImage(post),
    keywords: post.tags.length ? post.tags.join(", ") : undefined,
  }).replace(/<\//g, "<\\/");
}

function renderArticlePage(post) {
  const url = postUrl(post.slug);
  const image = postImage(post);
  const meta =
    (post.date ? `<span>${escapeHtml(formatDate(post.date))}</span>` : "") +
    `<span>${post.readingTime} min read</span>`;

  const tags = post.tags.length
    ? `<div class="post-tags">${post.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" class="js">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} · ${AUTHOR}</title>
  <meta name="description" content="${escapeHtml(post.description)}">
  <meta name="color-scheme" content="dark light">
  <meta name="theme-color" content="#080d16">
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${escapeHtml(post.title)}">
  <meta property="og:description" content="${escapeHtml(post.description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  ${post.date ? `<meta property="article:published_time" content="${post.date}T00:00:00+07:00">` : ""}
  ${post.tags.map((t) => `<meta property="article:tag" content="${escapeHtml(t)}">`).join("\n  ")}
  <link rel="alternate" type="application/atom+xml" title="Blog · ${AUTHOR}" href="/feed.xml">
  <link rel="preload" href="/assets/fonts/space-grotesk.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/ibm-plex-sans.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/style.css">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23080d16'/%3E%3Ctext x='32' y='46' font-family='Helvetica,Arial,sans-serif' font-size='36' font-weight='700' text-anchor='middle' fill='%23ede6d9'%3EZ%3C/text%3E%3C/svg%3E">
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
  <script>
    (function () {
      try {
        var t = window.localStorage.getItem("theme");
        document.documentElement.setAttribute("data-theme", t === "light" ? "light" : "dark");
      } catch (e) {}
    })();
  </script>
  <script type="application/ld+json">${articleJsonLd(post)}</script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>

  <header class="site-header">
    <nav class="container nav" aria-label="Primary">
      <a class="nav-brand" href="/"><span class="mark" aria-hidden="true"></span>Ze.in</a>
      <div class="nav-right">
        <div class="nav-links" id="nav-menu">
          <a href="/#projects">Projects</a>
          <a href="/#about">About</a>
          <a href="/blog.html" class="is-active" aria-current="page">Blog</a>
          <a href="/#contact">Contact</a>
        </div>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-menu" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M3.5 7h17M3.5 12h17M3.5 17h17"/></svg><span class="control-label">Menu</span></button>
        <button class="control theme-toggle" type="button" aria-label="Switch to light theme">
          <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19"/></svg>
          <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>
        </button>
      </div>
    </nav>
    <div class="progress" aria-hidden="true"><span></span></div>
  </header>

  <main class="post-page" id="main">
    <div class="container post-container">
      <a class="post-back" href="/blog.html">&larr; All posts</a>
      <article>
        <h1 class="post-title">${escapeHtml(post.title)}</h1>
        <div class="post-meta">${meta}</div>
        ${tags}
        <div class="prose">${MiniMarkdown.render(post.body)}</div>
      </article>
    </div>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <p>&copy; <span id="year"></span> ${AUTHOR}</p>
      <p><a href="https://github.com/zeinzulaziz/zeinzulaziz.github.io" target="_blank" rel="noopener">Source on GitHub</a></p>
    </div>
  </footer>

  <script src="/assets/js/site.js" defer></script>
</body>
</html>
`;
}

// post/ holds only generated pages — wipe and rewrite so deleted posts vanish.
await rm(pagesDir, { recursive: true, force: true });
for (const post of published) {
  const dir = join(pagesDir, post.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "index.html"), renderArticlePage(post), "utf8");
}

/* ---------- 3. project pages ---------- */
const projectsDir = join(root, "content", "projects");
const projectsOut = join(root, "content", "projects.json");
const projectPagesDir = join(root, "project");

const projectFiles = existsSync(projectsDir)
  ? (await readdir(projectsDir, { withFileTypes: true }))
      .filter((e) => e.isFile() && /\.md$/i.test(e.name) && e.name[0] !== "_")
      .map((e) => e.name)
  : [];

const projects = [];
for (const file of projectFiles) {
  const raw = await readFile(join(projectsDir, file), "utf8");
  const { data, body } = parseFrontmatter(raw);
  const slug = file.replace(/\.md$/i, "");
  projects.push({
    slug,
    title: data.title || slug.replace(/-/g, " "),
    summary: data.summary || data.description || excerpt(body),
    repo: typeof data.repo === "string" ? data.repo.trim() : "",
    demo: typeof data.demo === "string" ? data.demo.trim() : "",
    language: typeof data.language === "string" ? data.language.trim() : "",
    cover: typeof data.cover === "string" ? data.cover.trim() : "",
    private: data.private === true,
    tags: toArray(data.tags),
    date: data.date ? String(data.date).slice(0, 10) : "",
    draft: data.draft === true || data.published === false,
    body,
  });
}

projects.sort(
  (a, b) => String(b.date).localeCompare(String(a.date)) || a.title.localeCompare(b.title)
);
const liveProjects = projects.filter((p) => !p.draft);

// Same shape as posts.json: metadata only, the body stays on the page.
await writeManifest(
  projectsOut,
  "projects",
  liveProjects.map(({ body, ...meta }) => meta)
);

function projectUrl(slug) {
  return `${SITE}/project/${slug}/`;
}

function projectImage(project) {
  if (!project.cover) return `${SITE}/assets/img/og.jpg`;
  return project.cover.startsWith("/") ? SITE + project.cover : SITE + "/" + project.cover;
}

function projectRepoUrl(project) {
  return project.repo && !project.private
    ? `https://github.com/zeinzulaziz/${encodeURIComponent(project.repo)}`
    : "";
}

function projectJsonLd(project) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.title,
    description: project.summary,
    url: project.demo || projectUrl(project.slug),
    image: projectImage(project),
    codeRepository: projectRepoUrl(project) || undefined,
    author: { "@type": "Person", name: AUTHOR, url: SITE + "/" },
    keywords: project.tags.length ? project.tags.join(", ") : undefined,
  }).replace(/<\//g, "<\\/");
}

function renderProjectPage(project) {
  const url = projectUrl(project.slug);
  const repoHref = projectRepoUrl(project);

  // A project page without a repo is a case study, not a public repository.
  const status = project.private
    ? "Private project"
    : project.repo
      ? "Public repository"
      : "Case study";

  const facts =
    (project.language ? `<span>${escapeHtml(project.language)}</span>` : "") +
    `<span>${status}</span>` +
    (project.date ? `<span>${escapeHtml(formatDate(project.date))}</span>` : "");

  const tags = project.tags.length
    ? `<div class="post-tags">${project.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</div>`
    : "";

  const actions =
    project.demo || repoHref
      ? `<div class="action-row project-actions">` +
        (project.demo
          ? `<a class="btn btn-primary" href="${escapeHtml(project.demo)}" target="_blank" rel="noopener">Open live demo</a>`
          : "") +
        (repoHref
          ? `<a class="btn btn-ghost" href="${escapeHtml(repoHref)}" target="_blank" rel="noopener">Repository</a>`
          : "") +
        `</div>`
      : "";

  // The screenshot sits near the top of the page, so it loads eagerly; the
  // dimensions still reserve its space. Paths are absolute: this page lives at
  // /project/<slug>/.
  const coverSize = project.coverSize;
  const coverPath = project.cover ? project.cover.replace(/^\//, "") : "";
  const coverAttrs = coverPath
    ? srcsetFor(coverPath.replace(/\.webp$/i, ""), IMG_WIDTHS, "/")
    : "";
  const shot = project.cover
    ? `<figure class="project-shot"><img src="/${coverPath}"${coverAttrs ? ` srcset="${escapeHtml(coverAttrs)}" sizes="(min-width: 928px) 832px, 92vw"` : ""} alt="Screenshot of ${escapeHtml(project.title)}"${coverSize ? ` width="${coverSize.width}" height="${coverSize.height}"` : ""} decoding="async"></figure>`
    : "";

  const prose = project.body.trim()
    ? `<div class="prose">${MiniMarkdown.render(project.body)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" class="js">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(project.title)} · ${AUTHOR}</title>
  <meta name="description" content="${escapeHtml(project.summary)}">
  <meta name="color-scheme" content="dark light">
  <meta name="theme-color" content="#080d16">
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${escapeHtml(project.title)} · ${AUTHOR}">
  <meta property="og:description" content="${escapeHtml(project.summary)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${projectImage(project)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="alternate" type="application/atom+xml" title="Blog · ${AUTHOR}" href="/feed.xml">
  <link rel="preload" href="/assets/fonts/space-grotesk.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/ibm-plex-sans.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/style.css">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23080d16'/%3E%3Ctext x='32' y='46' font-family='Helvetica,Arial,sans-serif' font-size='36' font-weight='700' text-anchor='middle' fill='%23ede6d9'%3EZ%3C/text%3E%3C/svg%3E">
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
  <script>
    (function () {
      try {
        var t = window.localStorage.getItem("theme");
        document.documentElement.setAttribute("data-theme", t === "light" ? "light" : "dark");
      } catch (e) {}
    })();
  </script>
  <script type="application/ld+json">${projectJsonLd(project)}</script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>

  <header class="site-header">
    <nav class="container nav" aria-label="Primary">
      <a class="nav-brand" href="/"><span class="mark" aria-hidden="true"></span>Ze.in</a>
      <div class="nav-right">
        <div class="nav-links" id="nav-menu">
          <a href="/#projects" class="is-active" aria-current="page">Projects</a>
          <a href="/#about">About</a>
          <a href="/blog.html">Blog</a>
          <a href="/#contact">Contact</a>
        </div>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-menu" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M3.5 7h17M3.5 12h17M3.5 17h17"/></svg><span class="control-label">Menu</span></button>
        <button class="control theme-toggle" type="button" aria-label="Switch to light theme">
          <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19"/></svg>
          <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>
        </button>
      </div>
    </nav>
    <div class="progress" aria-hidden="true"><span></span></div>
  </header>

  <main class="post-page project-page" id="main">
    <div class="container post-container">
      <a class="post-back" href="/#projects">&larr; All projects</a>
      <article>
        <h1 class="post-title">${escapeHtml(project.title)}</h1>
        <p class="page-lede">${escapeHtml(project.summary)}</p>
        <div class="post-meta">${facts}</div>
        ${tags}
        ${actions}
        ${shot}
        ${prose}
      </article>
    </div>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <p>&copy; <span id="year"></span> ${AUTHOR}</p>
      <p><a href="https://github.com/zeinzulaziz/zeinzulaziz.github.io" target="_blank" rel="noopener">Source on GitHub</a></p>
    </div>
  </footer>

  <script src="/assets/js/site.js" defer></script>
</body>
</html>
`;
}

// project/ holds only generated pages — wipe and rewrite so deleted projects vanish.
await rm(projectPagesDir, { recursive: true, force: true });
for (const project of liveProjects) {
  project.coverSize = project.cover
    ? await imageSize(join(root, project.cover.replace(/^\//, "")))
    : null;
  const dir = join(projectPagesDir, project.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "index.html"), renderProjectPage(project), "utf8");
}

/* ---------- 4. prerendered lists: home cards + blog index ---------- */
// Both lists land inside marker comments in the static HTML, so the markup is
// in the document from the first byte: no fetch, no skeleton, no layout shift,
// and the crawler sees the same list a visitor does.

const GITHUB_USER = "zeinzulaziz";

// Repositories do not carry a live URL or a nicer label, so both are curated.
const liveDemo = {
  "harga-pangan": "https://zeinzulaziz.github.io/harga-pangan/",
  "convert-gold": "https://zeinzulaziz.github.io/convert-gold/",
  "broken-link-checker": "https://broken-link-checker-sepia.vercel.app",
};

const repoLabels = {
  "harga-pangan": "Food Prices",
  "convert-gold": "Convert Gold",
  "broken-link-checker": "Broken Link Checker",
  invoice: "Invoice Generator",
};

const repoDescriptions = {
  "harga-pangan":
    "Food Prices: producer price dashboard for East Java, built on SISKAPERBAPO data.",
  "convert-gold": "Gold price calculator to run quick numbers before trading.",
  invoice:
    "An invoice workspace for small businesses: build and manage invoices, " +
    "export PDFs, track payments, and keep a cloud backup. Firebase auth keeps " +
    "each workspace closed.",
};

/* Work with no public repository. content/repos.json holds what the GitHub API
   returns, so these cannot come from there; `private: true` drops the repo link
   and the star count, and a curated entry loses to a real repository if one ever
   appears with the same name. */
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

async function readRepos() {
  try {
    const data = JSON.parse(await readFile(join(root, "content", "repos.json"), "utf8"));
    const list = Array.isArray(data) ? data : data && data.repos;
    return Array.isArray(list) ? list : [];
  } catch {
    // No snapshot yet (or a broken one): the curated projects still render.
    return [];
  }
}

function repoUrl(name) {
  return `https://github.com/${GITHUB_USER}/${encodeURIComponent(name)}`;
}

function firstLetter(name) {
  return name.charAt(0).toUpperCase();
}

function renderProjectCard(repo, index, pageByName) {
  const name = repo.name;
  const page = pageByName[name] || null;
  const pageHref = page ? `project/${encodeURIComponent(page.slug)}/` : null;
  const demo = liveDemo[name] || (page && page.demo) || (repo.homepage && repo.homepage.trim()) || null;
  const hasScreenshot = Boolean(liveDemo[name] || repo.screenshot || (page && page.cover));
  const isPrivate = repo.private === true || Boolean(page && page.private);
  // No repository to link to, but not private either: a case study page.
  const caseStudy = repo.caseStudy === true || Boolean(page && !page.repo && !page.private);
  const repoHref = isPrivate || caseStudy ? null : repoUrl(name);
  /* A private project still gets a clickable title, it just points at the
     project page or the live product instead of a repository outsiders cannot
     open. */
  const titleHref = pageHref || repoHref || demo;

  const shotSrc = page && page.cover
    ? page.cover.replace(/^\//, "")
    : `assets/img/${encodeURIComponent(name)}.webp`;
  const shotBase = shotSrc.replace(/\.webp$/i, "");
  /* The featured card draws its media at roughly half the container, the plain
     rows draw a 104px thumb at every width. */
  const featuredPreview = hasScreenshot
    ? `<img src="${escapeHtml(shotSrc)}"${imageAttrs(shotBase, "(min-width: 840px) 500px, 90vw")} alt="Preview ${escapeHtml(name)}" loading="lazy" decoding="async" width="640" height="360">`
    : `<div class="preview-placeholder" aria-hidden="true">${escapeHtml(firstLetter(name))}</div>`;
  const thumb = `<img src="${escapeHtml(shotSrc)}"${imageAttrs(shotBase, "104px", [200, 400])} alt="" loading="lazy" decoding="async" width="640" height="400">`;

  const livePlate = demo ? `<span class="live-plate">LIVE</span>` : "";

  const links = pageHref || repoHref || demo
    ? `<p class="project-links">` +
      (pageHref ? `<a href="${pageHref}">Details</a>` : "") +
      (repoHref ? `<a href="${repoHref}" target="_blank" rel="noopener">Repo</a>` : "") +
      (demo ? `<a href="${escapeHtml(demo)}" target="_blank" rel="noopener">Demo</a>` : "") +
      `</p>`
    : "";

  const meta =
    `<p class="project-meta"><span class="project-lang">${escapeHtml(repo.language || "N/A")}</span>` +
    `<span>${isPrivate ? "Private" : caseStudy ? "Case study" : `★ ${repo.stargazers_count || 0}`}</span></p>`;

  const label = page && page.title ? page.title : repoLabels[name] || name.replace(/[-_]/g, " ");
  const title = titleHref
    ? pageHref
      ? `<a href="${pageHref}">${escapeHtml(label)}</a>`
      : `<a href="${escapeHtml(titleHref)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`
    : escapeHtml(label);

  const desc = page && page.summary
    ? page.summary
    : repoDescriptions[name] ||
      repo.description ||
      (isPrivate ? "Private project." : caseStudy ? "Case study." : "Public repository with no description.");

  const main =
    `<div class="project-main">` +
    `<h3 class="project-title">${title}</h3>` +
    `<p class="project-desc">${escapeHtml(desc)}</p>` +
    `</div>`;

  const classes = `project-row reveal${index === 0 ? " is-featured" : ""}`;

  if (index === 0) {
    return `<article class="${classes}"><div class="project-media">${featuredPreview}${livePlate}</div>${main}<div class="project-side">${meta}${links}</div></article>`;
  }
  if (hasScreenshot) {
    return `<article class="${classes}"><div class="project-media">${thumb}</div>${main}<div class="project-side">${meta}${links}</div></article>`;
  }
  return `<article class="${classes}">${main}<div class="project-side">${meta}${links}</div></article>`;
}

function projectCardList(repos) {
  const pageByName = {};
  liveProjects.forEach((page) => {
    pageByName[page.slug] = page;
    if (page.repo) pageByName[page.repo] = page;
  });

  // Curated work leads the list; a real repository of the same name wins.
  const names = new Set(repos.map((r) => r.name));
  const all = ownedProjects.filter((p) => !names.has(p.name)).concat(repos);
  return {
    count: all.length,
    cards: all.map((repo, index) => renderProjectCard(repo, index, pageByName)),
  };
}

function renderPostCard(post, index) {
  const meta =
    `<div class="post-meta">` +
    (post.date ? `<span>${escapeHtml(formatDate(post.date))}</span>` : "") +
    `<span>${post.readingTime} min read</span>` +
    `</div>`;

  const tags = post.tags.length
    ? `<div class="post-tags">${post.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</div>`
    : "";

  // Stagger is capped: a long index should not leave the last card waiting.
  const delay = Math.min(index * 60, 360);

  return (
    `<article class="post-card reveal${post.type === "note" ? " is-note" : ""}" style="--d:${delay}ms">` +
    meta +
    `<h2 class="post-card-title"><a href="post/${encodeURIComponent(post.slug)}/">${escapeHtml(post.title)}</a></h2>` +
    (post.description ? `<p class="post-card-desc">${escapeHtml(post.description)}</p>` : "") +
    tags +
    `</article>`
  );
}

function postCardCount() {
  const notes = published.filter((p) => p.type === "note").length;
  const articles = published.length - notes;
  return (
    `${articles} ${articles === 1 ? "article" : "articles"} · ` +
    `${notes} ${notes === 1 ? "note" : "notes"}`
  );
}

/* Replace everything between the marker pair, keeping the markers. The block is
   indented to match the opening marker, so the generated file reads like a hand
   written one. */
function injectBlock(source, name, lines, file) {
  const re = new RegExp(`([ \\t]*<!-- ${name}:start -->)[\\s\\S]*?([ \\t]*<!-- ${name}:end -->)`);
  const found = source.match(re);
  if (!found) throw new Error(`${file}: marker "${name}:start/end" not found`);
  const indent = (found[1].match(/^[ \t]*/) || [""])[0];
  const body = lines.map((line) => (line ? indent + line : "")).join("\n");
  return source.replace(re, () => `${found[1]}\n${body}\n${found[2]}`);
}

function fillSlot(source, pattern, value, file) {
  if (!pattern.test(source)) throw new Error(`${file}: expected slot not found`);
  return source.replace(pattern, (_m, open, close) => open + value + close);
}

const repos = await readRepos();
const cards = projectCardList(repos);

const indexPath = join(root, "index.html");
let indexHtml = await readFile(indexPath, "utf8");
indexHtml = injectBlock(indexHtml, "projects", cards.cards, "index.html");
indexHtml = fillSlot(
  indexHtml,
  /(<span class="stat-num" id="statProjects">)[^<]*(<\/span>)/,
  String(cards.count),
  "index.html"
);
await writeFile(indexPath, indexHtml, "utf8");

const blogPath = join(root, "blog.html");
let blogHtml = await readFile(blogPath, "utf8");
const postCards = published.length
  ? published.map(renderPostCard)
  : ['<p class="blog-empty">No articles yet. Check back soon.</p>'];
blogHtml = injectBlock(blogHtml, "posts", postCards, "blog.html");
blogHtml = fillSlot(
  blogHtml,
  /(<p class="page-count" id="blogCount">)[^<]*(<\/p>)/,
  postCardCount(),
  "blog.html"
);
await writeFile(blogPath, blogHtml, "utf8");

/* ---------- 5. sitemap ---------- */
const latest = published.length && published[0].date ? published[0].date : "";
const sitemapUrls = [
  `<url><loc>${SITE}/</loc>${latest ? `<lastmod>${latest}</lastmod>` : ""}</url>`,
  `<url><loc>${SITE}/blog.html</loc>${latest ? `<lastmod>${latest}</lastmod>` : ""}</url>`,
  ...published.map(
    (p) => `<url><loc>${postUrl(p.slug)}</loc>${p.date ? `<lastmod>${p.date}</lastmod>` : ""}</url>`
  ),
  ...liveProjects.map(
    (p) => `<url><loc>${projectUrl(p.slug)}</loc>${p.date ? `<lastmod>${p.date}</lastmod>` : ""}</url>`
  ),
];
await writeFile(
  join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join("\n")}\n</urlset>\n`,
  "utf8"
);

/* ---------- 6. Atom feed ---------- */
const feedEntries = published.map((p) => {
  const url = postUrl(p.slug);
  const d = p.date || latest;
  return `  <entry>
    <title>${escapeXml(p.title)}</title>
    <link href="${url}" rel="alternate" type="text/html"/>
    <id>${url}</id>
    <updated>${d ? `${d}T00:00:00+07:00` : new Date().toISOString()}</updated>
    <summary>${escapeXml(p.description)}</summary>
    <content type="html">${escapeXml(MiniMarkdown.render(p.body))}</content>
  </entry>`;
});
await writeFile(
  join(root, "feed.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Blog · ${AUTHOR}</title>
  <subtitle>Articles and short notes on WordPress development, JavaScript, and building small products with AI.</subtitle>
  <link href="${SITE}/feed.xml" rel="self" type="application/atom+xml"/>
  <link href="${SITE}/blog.html" rel="alternate" type="text/html"/>
  <updated>${latest ? `${latest}T00:00:00+07:00` : new Date().toISOString()}</updated>
  <id>${SITE}/blog.html</id>
  <author><name>${AUTHOR}</name><uri>${SITE}/</uri></author>
${feedEntries.join("\n")}
</feed>
`,
  "utf8"
);

const drafts = posts.length - published.length;
console.log(
  `built: posts.json (${posts.length} post, ${drafts} draft), ` +
    `projects.json (${liveProjects.length} proyek), ` +
    `${published.length} halaman artikel, ${liveProjects.length} halaman proyek, ` +
    `index.html (${cards.count} kartu), blog.html (${published.length} kartu), ` +
    `sitemap.xml, feed.xml`
);
