// Build-time generator. Runs locally (node tools/build.mjs) and in CI.
// Outputs:
//   content/posts.json          — manifest consumed by blog.js
//   post/<slug>/index.html      — prerendered article (shareable, indexable)
//   sitemap.xml                 — index, blog, every published article
//   feed.xml                    — Atom feed of published articles
// Drafts never leave this script: no page, no sitemap entry, no feed entry.
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

/* ---------- 1. manifest ---------- */
// Body stays out of the manifest: blog.js only needs metadata, and the raw
// markdown is fetched per post when someone actually opens one.
await writeFile(
  postsOut,
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      posts: posts.map(({ body, ...meta }) => meta),
    },
    null,
    2
  ) + "\n",
  "utf8"
);

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
        var m = window.localStorage.getItem("motion");
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.documentElement.setAttribute("data-motion", m ? m : (reduce ? "off" : "on"));
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
        <button class="control motion-toggle" type="button" aria-label="Turn motion off">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="6.6"/><path d="M14.6 7.8a6.6 6.6 0 0 0 0 8.4"/></svg>
          <span class="control-label">Motion on</span>
        </button>
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
      <p>Hand-coded HTML, CSS, and JavaScript. <a href="https://github.com/zeinzulaziz" target="_blank" rel="noopener">Source on GitHub</a>.</p>
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
await writeFile(
  projectsOut,
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      projects: liveProjects.map(({ body, ...meta }) => meta),
    },
    null,
    2
  ) + "\n",
  "utf8"
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

  const facts =
    (project.language ? `<span>${escapeHtml(project.language)}</span>` : "") +
    `<span>${project.private ? "Private project" : "Public repository"}</span>` +
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

  const shot = project.cover
    ? `<figure class="project-shot"><img src="/${project.cover.replace(/^\//, "")}" alt="Screenshot of ${escapeHtml(project.title)}" loading="lazy" decoding="async"></figure>`
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
        var m = window.localStorage.getItem("motion");
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.documentElement.setAttribute("data-motion", m ? m : (reduce ? "off" : "on"));
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
        <button class="control motion-toggle" type="button" aria-label="Turn motion off">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="6.6"/><path d="M14.6 7.8a6.6 6.6 0 0 0 0 8.4"/></svg>
          <span class="control-label">Motion on</span>
        </button>
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
      <p>Hand-coded HTML, CSS, and JavaScript. <a href="https://github.com/zeinzulaziz" target="_blank" rel="noopener">Source on GitHub</a>.</p>
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
  const dir = join(projectPagesDir, project.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "index.html"), renderProjectPage(project), "utf8");
}

/* ---------- 4. sitemap ---------- */
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

/* ---------- 5. Atom feed ---------- */
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
    `sitemap.xml, feed.xml`
);
