# AGENTS.md — Portfolio GitHub Pages

## Konteks Project
Landing page portofolio statis yang di-deploy ke GitHub Pages: https://zeinzulaziz.github.io/

## Peta Cepat
| Kalau mengerjakan | Baca/edit |
|---|---|
| Hero, gerhana, animasi scroll | `assets/js/scene.js`, `assets/js/journey.js` (+ `docs/SCENE.md`) |
| Tema gelap/terang, nav, analytics | `assets/js/site.js`, `assets/css/style.css` |
| Token desain & palet | `DESIGN.md`, `:root` di `assets/css/style.css` |
| Kartu proyek & data repo | `assets/js/main.js`, `content/repos.json` (generate: `tools/build-repos.mjs`) |
| Artikel blog | `content/posts/*.md` → `node tools/build.mjs` |
| Halaman detail proyek | `content/projects/*.md` → `node tools/build.mjs` |
| Renderer Markdown | `assets/js/markdown.js` |
| CMS `/admin/` | `admin/config.yml` |
| Ikon & OG image | `tools/make-icon.swift`, `tools/make-og.swift` |
| Build & deploy | `tools/build.mjs`, `.github/workflows/build-site.yml` (push = deploy) |

Jangan edit manual (hasil generate): `post/*/index.html`, `project/*/index.html`,
`content/posts.json`, `content/projects.json`, `content/repos.json`,
`sitemap.xml`, `feed.xml`.

## Stack
- Vanilla HTML, CSS, JavaScript (tanpa framework); build script kecil pakai Node (tanpa dependensi)
- Daftar proyek dari snapshot `content/repos.json` (sebelumnya GitHub API langsung)
- CMS: Sveltia CMS (drop-in Decap/Netlify CMS) dari CDN, backend GitHub + Access Token

## Struktur
- `index.html` — halaman utama
- `blog.html` — daftar artikel
- `post.html?slug=<slug>` — fallback render client untuk link lama (link baru pakai `post/<slug>/`)
- `post/<slug>/index.html` — artikel prerender (hasil build, jangan edit manual)
- `project/<slug>/index.html` — halaman detail proyek prerender (hasil build, jangan edit manual)
- `content/projects/*.md` — sumber halaman detail proyek (satu file per proyek)
- `content/projects.json` — manifest proyek, hasil generate (dipakai `main.js` untuk link kartu)
- `404.html` — halaman error kustom (dipakai otomatis GitHub Pages)
- `sitemap.xml`, `feed.xml` (Atom), `robots.txt` — hasil build
- `site.webmanifest`, `assets/img/apple-touch-icon.png` — ikon app/PWA
- `DESIGN.md` — arah desain & token (palet, tipografi, motion), sumber kebenaran tampilan
- `PRODUCT.md` — konteks produk: pengguna, tujuan, prinsip
- `assets/css/style.css` — styling (token tema via `:root` gelap default + `[data-theme="light"]`, termasuk `@font-face` self-hosted)
- `assets/fonts/` — woff2 self-hosted (Space Grotesk, IBM Plex Sans/Mono), lisensi SIL OFL
- `assets/js/site.js` — tema (gelap default/terang + localStorage), nav mobile, tahun footer, opt-in GoatCounter
- `assets/js/journey.js` — progres halaman, chapter rail, event `journey` (hanya halaman utama)
- `assets/js/scene.js` — gerhana WebGL (three.js) di belakang hero, hanya dimuat halaman utama
- `assets/vendor/three/` — three.js min (MIT) yang di-vendor; `scene.js` mengimpornya secara relatif
- `assets/js/main.js` — logika & data proyek (baca `content/repos.json`; proyek privat tanpa repo GitHub dikurasi di `ownedProjects` dalam file ini, jangan taruh di `repos.json` karena ditimpa build)
- `assets/js/blog.js` — pemuat data artikel (manifest + fallback GitHub API)
- `assets/js/markdown.js` — renderer Markdown sendiri, tanpa library (dipakai blog.js & build)
- `assets/img/` — avatar (`avatar.svg`, ilustrasi) & screenshot preview proyek (`<nama-repo>.webp`)
- `content/posts/*.md` — sumber artikel (satu file per artikel)
- `content/posts.json` — manifest daftar artikel, hasil generate
- `content/repos.json` — snapshot daftar repo GitHub, hasil generate
- `admin/` — Sveltia CMS (editor visual di `/admin/`)
- `tools/build.mjs` — build: manifest + halaman artikel prerender + sitemap + feed
- `tools/build-repos.mjs` — snapshot `content/repos.json` dari GitHub API (pakai `GITHUB_TOKEN` di CI)
- `tools/make-og.swift`, `tools/make-icon.swift` — generator gambar OG & ikon (macOS saja)

## Blog
Artikel adalah file Markdown di `content/posts/` dengan frontmatter:

```markdown
---
title: "Judul"
date: 2026-09-29
type: article
description: "Ringkasan singkat."
tags: ["catatan"]
draft: false
---

Isi artikel.
```

- `type: article` untuk artikel, `type: note` untuk catatan singkat
- `draft: true` menyembunyikan artikel dari pengunjung
- **Slug = nama file** (misal `judul-artikel.md` → `post/judul-artikel/`). Di CMS, slug diisi lewat Slug panel saat create dan terkunci setelahnya (`editable: [create]`). Frontmatter `slug` opsional — hanya dipakai sebagai fallback untuk link lama yang namanya beda dari file
- Frontmatter `cover` (opsional, path gambar) dipakai sebagai OG image artikel; default-nya `assets/img/og.jpg`
- Format markdown yang didukung: heading, tebal/miring, kode, list (termasuk bersarang & checklist), blockquote, tabel, tautan, gambar, horizontal rule

### Alur tulis
1. **Paling mudah:** buka `/admin/`, login pakai GitHub Access Token, klik **New Post**, isi slug di Slug panel, publish. GitHub Actions (`.github/workflows/build-site.yml`) me-regenerate manifest + halaman prerender + sitemap + feed, lalu GitHub Pages deploy.
2. **Manual:** buat/edit file `.md`, jalankan `node tools/build.mjs`, lalu `git push`.

### Cara kerja data artikel
Halaman artikel adalah HTML prerender (`post/<slug>/index.html`) — tanpa JS pun
terbaca crawler dan pembaca feed. `blog.js` memuat `content/posts.json` lebih
dulu, lalu menggabungkan daftar `content/posts/` dari GitHub API untuk slug
yang belum ada di manifest, sehingga artikel CMS baru langsung muncul walau
Actions belum selesai. Daftar ditampilkan dari cache lalu di-revalidate di
background; cache `localStorage` 1 menit (diabaikan di localhost).
`post.html?slug=` tetap ada sebagai fallback link lama dan menitipkan canonical
ke URL prerender.

### Penting
- `.nojekyll` wajib ada, kalau tidak Jekyll akan mengubah file `.md` ber-frontmatter menjadi HTML dan file mentahnya tidak ter-deploy.
- Path di `admin/config.yml` ditulis dari root repo (misal `/content/posts`), karena CMS berada di `/admin/`.

## Projects
Halaman detail proyek mengikuti pola yang sama dengan artikel: sumber Markdown di
`content/projects/`, HTML prerender di `project/<slug>/index.html`, manifest di
`content/projects.json`. Frontmatter:

```markdown
---
title: "Food Prices"
summary: "One or two sentences for the card and SEO."
date: 2026-10-08
repo: harga-pangan
demo: https://zeinzulaziz.github.io/harga-pangan/
language: HTML
cover: assets/img/harga-pangan.webp
private: false
tags: ["dashboard", "agriculture"]
draft: false
---

Isi halaman (Markdown, opsional).
```

- **Slug = nama file** (`harga-pangan.md` → `project/harga-pangan/`). Samakan dengan nama repo supaya `main.js` bisa mencocokkan kartu ke halaman.
- `repo` diisi nama repo GitHub; `private: true` menyembunyikan link repo dan status publik.
- `demo` dan `cover` opsional. Tanpa `cover`, halaman memakai `assets/img/og.jpg` dan kartu memakai `assets/img/<repo>.webp`.
- `draft: true` menyembunyikan proyek dari kartu, halaman, dan sitemap.
- Kartu di homepage membaca manifest: judul dan ringkasan diambil dari file proyek, lalu menambah link **Details** ke halaman detail. Repo yang belum punya file proyek tetap tampil dengan perilaku lama (link ke repo/demo).

Alur: edit `content/projects/<slug>.md` (di `/admin/` atau manual), jalankan
`node tools/build.mjs`, commit. CI juga otomatis build saat file proyek berubah.

## Halaman utama: gerhana & chapter
Detail teknis (three.js, stage scroll, palet, fallback, kontrak event) ada di
`docs/SCENE.md`. Baca hanya saat menyentuh `assets/js/scene.js` atau
`assets/js/journey.js`.

## Komunikasi
- Bahasa Indonesia untuk komunikasi dengan user
- Konten website (UI) menggunakan Bahasa Inggris

## Catatan
- Jangan tambah library/framework tanpa konfirmasi
- Screenshot preview bisa di-regenerate dengan membuka URL live demo proyek
- Sveltia CMS dimuat dari CDN (`unpkg.com`), jadi `/admin/` butuh koneksi internet
- Analytics: GoatCounter (privacy-friendly, opt-in). Aktifkan dengan mengisi kode situs di `ANALYTICS` dalam `assets/js/site.js`; kosong = mati
- Font self-hosted (assets/fonts, SIL OFL). Kalau ganti/gaya font, ubah `@font-face` di `style.css` — jangan tarik Google Fonts lagi
