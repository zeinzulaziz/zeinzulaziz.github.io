# AGENTS.md — Portfolio GitHub Pages

## Konteks Project
Landing page portofolio statis yang di-deploy ke GitHub Pages: https://zeinzulaziz.github.io/

## Peta Cepat
| Kalau mengerjakan | Baca/edit |
|---|---|
| Chapter, rail, scroll-spy, animasi scroll | `assets/css/style.css` (+ `docs/CHAPTERS.md`) |
| Tema gelap/terang, nav, analytics | `assets/js/site.js`, `assets/css/style.css` |
| Token desain & palet | `DESIGN.md`, `:root` di `assets/css/style.css` |
| Kartu proyek & data repo | `tools/build.mjs`, `content/repos.json` (generate: `tools/build-repos.mjs`) |
| Artikel blog | `content/posts/*.md` → `node tools/build.mjs` |
| Halaman detail proyek | `content/projects/*.md` → `node tools/build.mjs` |
| Renderer Markdown | `assets/js/markdown.js` |
| CMS `/admin/` | `admin/config.yml` |
| Ikon & OG image | `tools/make-icon.swift`, `tools/make-og.swift` |
| Build & deploy | `tools/build.mjs`, `.github/workflows/build-site.yml` (push = deploy) |

Jangan edit manual (hasil generate): `post/*/index.html`, `project/*/index.html`,
blok di antara marker `<!-- projects:start -->`/`<!-- projects:end -->` di
`index.html`, blok di antara `<!-- posts:start -->`/`<!-- posts:end -->` di
`blog.html`, `content/posts.json`, `content/projects.json`, `content/repos.json`,
`sitemap.xml`, `feed.xml`.

## Stack
- Vanilla HTML, CSS, JavaScript (tanpa framework); build script kecil pakai Node (tanpa dependensi)
- Daftar proyek dari snapshot `content/repos.json` (sebelumnya GitHub API langsung)
- Kartu proyek dan daftar artikel dirender saat build, jadi JS runtime hanya untuk tema, nav, dan layanan pihak ketiga
- CMS: Sveltia CMS (drop-in Decap/Netlify CMS) dari CDN, backend GitHub + Access Token

## Struktur
- `index.html` — halaman utama
- `blog.html` — daftar artikel
- `post.html?slug=<slug>` — fallback render client untuk link lama (link baru pakai `post/<slug>/`)
- `post/<slug>/index.html` — artikel prerender (hasil build, jangan edit manual)
- `project/<slug>/index.html` — halaman detail proyek prerender (hasil build, jangan edit manual)
- `content/projects/*.md` — sumber halaman detail proyek (satu file per proyek)
- `content/projects.json` — manifest proyek, hasil generate (metadata saja; kartunya sudah jadi HTML di `index.html`)
- `404.html` — halaman error kustom (dipakai otomatis GitHub Pages)
- `sitemap.xml`, `feed.xml` (Atom), `robots.txt` — hasil build
- `site.webmanifest`, `assets/img/apple-touch-icon.png` — ikon app/PWA
- `DESIGN.md` — arah desain & token (palet, tipografi, motion), sumber kebenaran tampilan
- `PRODUCT.md` — konteks produk: pengguna, tujuan, prinsip
- `assets/css/style.css` — styling (token tema via `:root` gelap default + `[data-theme="light"]`, termasuk `@font-face` self-hosted)
- `assets/fonts/` — woff2 self-hosted (Space Grotesk, IBM Plex Sans/Mono), lisensi SIL OFL
- `assets/js/site.js` — tema (gelap default/terang + localStorage), nav mobile, tahun footer, opt-in GoatCounter
- `assets/js/journey.js` — chapter aktif untuk rail `#opening…#contact` (hanya halaman utama), menulis `data-chapter-active` + kelas `is-current`; bukan animasi, dan hanya dimuat kalau browser tidak punya CSS scroll timeline
- `assets/js/blog.js` — pemuat satu artikel untuk `post.html?slug=` (fallback link lama); daftar artikel sudah jadi HTML di `blog.html`
- `assets/js/markdown.js` — renderer Markdown sendiri, tanpa library (dipakai blog.js & build)
- `assets/img/` — avatar (`avatar.svg`, `avatar-anime.webp`) & screenshot preview proyek (`<nama-repo>.webp`)
- `content/posts/*.md` — sumber artikel (satu file per artikel)
- `content/posts.json` — manifest daftar artikel, hasil generate (metadata saja; tidak ada lagi yang membacanya saat runtime, daftarnya sudah ada di `blog.html`)
- `content/repos.json` — snapshot daftar repo GitHub, hasil generate
- `admin/` — Sveltia CMS (editor visual di `/admin/`)
- `tools/build.mjs` — build: manifest + kartu `index.html` + daftar `blog.html` + halaman artikel/proyek prerender + sitemap + feed
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
1. **Paling mudah:** buka `/admin/`, login pakai GitHub Access Token, klik **New Post**, isi slug di Slug panel, publish. GitHub Actions (`.github/workflows/build-site.yml`) me-regenerate manifest + daftar blog + kartu + halaman prerender + sitemap + feed, lalu GitHub Pages deploy.
2. **Manual:** buat/edit file `.md`, jalankan `node tools/build.mjs` (script ini juga menulis ulang blok kartu di `index.html` dan `blog.html`), lalu `git push`.

### Cara kerja data artikel
Daftar artikel adalah HTML prerender di dalam `blog.html` (blok `posts:start`→
`posts:end`), dan tiap artikel punya halaman sendiri di `post/<slug>/index.html`.
Tanpa JS pun crawler, pembaca feed, dan pengunjung melihat daftar yang sama — tidak
ada fetch, tidak ada skeleton, tidak ada layout shift.

Konsekuensinya: artikel baru muncul setelah Actions selesai (sekitar satu menit
setelah publish), bukan seketika. Dulu `blog.js` menutup jeda itu dengan menarik
manifest + daftar file dari GitHub API di browser; itu dilepas supaya halaman
tidak perlu render daftar sama sekali.

`blog.js` sekarang hanya dipakai `post.html?slug=` — fallback untuk link lama —
dan menitipkan canonical ke URL prerender.

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

- **Slug = nama file** (`harga-pangan.md` → `project/harga-pangan/`). Samakan dengan nama repo supaya build bisa mencocokkan kartu ke halaman.
- `repo` diisi nama repo GitHub; `private: true` menyembunyikan link repo dan status publik.
- `demo` dan `cover` opsional. Tanpa `cover`, halaman memakai `assets/img/og.jpg` dan kartu memakai `assets/img/<repo>.webp`.
- `draft: true` menyembunyikan proyek dari kartu, halaman, dan sitemap.
- Kartu di homepage dirender `tools/build.mjs` dari `content/repos.json` +
  `content/projects.json`: judul dan ringkasan dari file proyek, plus link
  **Details** ke halaman detail. Repo tanpa file proyek tetap tampil dengan
  perilaku lama (link ke repo/demo).
- Proyek privat tanpa repo GitHub dikurasi di `ownedProjects` dalam
  `tools/build.mjs`, jangan taruh di `repos.json` karena ditimpa
  `tools/build-repos.mjs`. Kunci urutan kartu ada di sana: `ownedProjects` di
  depan, repo GitHub di belakang, dan kartu pertama jadi featured.

Alur: edit `content/projects/<slug>.md` (di `/admin/` atau manual), jalankan
`node tools/build.mjs`, commit. CI juga otomatis build saat file proyek berubah.

## Halaman utama: chapter, rail, dan scroll-spy
Empat chapter (`#opening`, `#projects`, `#about`, `#contact`) plus rail di gutter
kanan. Rail, highlight nav, dan scroll cue dikerjakan CSS scroll timeline: tiap
chapter mendeklarasikan `view-timeline` sendiri, `timeline-scope` di `html`
mengangkat namanya ke dokumen, dan tiap link membaca jendela `48dvh` →
`calc(100% - 48dvh)` dari chapter-nya. Tidak ada `scroll` event.

Detail lengkap (rumus jendela, `@property --lit`, jebakan spesifisitas, dan apa
saja yang harus diubah saat menambah chapter) ada di `docs/CHAPTERS.md`. Baca hanya
saat menyentuh blok scroll-spy/reveal di `assets/css/style.css` atau mengubah
chapter di `index.html`.

## Animasi scroll
Progres halaman, reveal, word-rise tipe `.display`, chapter rail, dan scroll cue → CSS native (`animation-timeline: scroll()/view()`), bukan `scroll` event atau `IntersectionObserver`. Wajib `@supports`, `prefers-reduced-motion`, `animation-duration: 1ms`. Tidak ada JS untuk animasi; `journey.js` hanya state chapter dan hanya dimuat di browser tanpa scroll timeline. Pola: skill `scroll-driven-animations`.

## Komunikasi
- Bahasa Indonesia untuk komunikasi dengan user
- Konten website (UI) menggunakan Bahasa Inggris

## Catatan
- **Pratinjau lokal lewat server, bukan `file://`.** Halaman prerender memakai path absolut (`/assets/...`), dan di bawah `file://` link `post/<slug>/` hanya jadi directory listing, bukan artikel. Jalankan `python3 -m http.server 8000` lalu buka `http://127.0.0.1:8000/`.
- Jangan tambah library/framework tanpa konfirmasi
- Screenshot preview bisa di-regenerate dengan membuka URL live demo proyek
- Sveltia CMS dimuat dari CDN (`unpkg.com`), jadi `/admin/` butuh koneksi internet
- Analytics: GoatCounter (privacy-friendly, opt-in). Aktifkan dengan mengisi kode situs di `ANALYTICS` dalam `assets/js/site.js`; kosong = mati
- Font self-hosted (assets/fonts, SIL OFL). Kalau ganti/gaya font, ubah `@font-face` di `style.css` — jangan tarik Google Fonts lagi
