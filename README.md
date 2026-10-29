# zeinzulaziz.github.io

Source for [zeinzulaziz.github.io](https://zeinzulaziz.github.io/) — a portfolio and
blog that is a static site, one build script, and nothing else.

## Why it looks like this

No framework, no bundler, no client-side router. GitHub Pages serves plain files;
the "build" is a single Node script that runs before deploy. The page loads fast
because there is nothing to hydrate.

## Structure

| Path | What it is |
|---|---|
| `index.html` | Home page, hand-written |
| `blog.html`, `post.html` | Blog index and article shell |
| `post/<slug>/index.html` | Prerendered articles (generated) |
| `content/posts/*.md` | Posts: markdown + frontmatter |
| `content/projects/*.md` | Project entries |
| `tools/build.mjs` | The generator: posts → HTML, sitemap, Atom feed |
| `tools/build-repos.mjs` | Snapshots GitHub repo metadata into `content/repos.json` |
| `admin/` | Sveltia CMS config, so posts can be written from the browser |
| `tools/make-icon.swift`, `tools/make-og.swift` | Icon and OG-image generation (Swift, run locally) |
| `DESIGN.md`, `PRODUCT.md` | Design tokens and the rules the page has to follow |

## The build

```bash
node tools/build.mjs
```

It reads `content/posts/*.md`, renders them with the same mini-markdown renderer
the site ships (so previews and output can never disagree), writes one folder per
published post, and regenerates `sitemap.xml` and `feed.xml`.

Drafts never leave the script: no page, no sitemap entry, no feed entry.

`.github/workflows/build-site.yml` runs the build on every content push, and once
a day to refresh the repo snapshot.

## Design rules

`DESIGN.md` and `PRODUCT.md` are short on purpose. The short version: one accent
colour, spent only where it carries meaning; no section exists because a template
had one; every link points at something that exists.
