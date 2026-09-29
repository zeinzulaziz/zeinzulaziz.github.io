# AGENTS.md — Portfolio GitHub Pages

## Konteks Project
Landing page portofolio statis yang di-deploy ke GitHub Pages: https://zeinzulaziz.github.io/

## Stack
- Vanilla HTML, CSS, JavaScript (tanpa framework, tanpa build tool)
- Data proyek diambil dari GitHub API (username: `zeinzulaziz`)
- CMS: Sveltia CMS (drop-in Decap/Netlify CMS) dari CDN, backend GitHub + Access Token

## Struktur
- `index.html` — halaman utama
- `blog.html` — daftar artikel
- `post.html?slug=<slug>` — baca satu artikel
- `assets/css/style.css` — styling
- `assets/js/main.js` — logika & data proyek
- `assets/js/blog.js` — pemuat data artikel (manifest + fallback GitHub API)
- `assets/js/markdown.js` — renderer Markdown sendiri, tanpa library
- `assets/img/` — screenshot preview proyek
- `content/posts/*.md` — sumber artikel (satu file per artikel)
- `content/posts.json` — manifest daftar artikel, hasil generate
- `admin/` — Sveltia CMS (editor visual di `/admin/`)
- `tools/build-index.mjs` — regenerate `content/posts.json` dari file `.md`

## Blog
Artikel adalah file Markdown di `content/posts/` dengan frontmatter:

```markdown
---
title: "Judul"
slug: "judul-artikel"
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
- Nama file wajib sama dengan `slug`
- Format markdown yang didukung: heading, tebal/miring, kode, list (termasuk bersarang & checklist), blockquote, tabel, tautan, gambar, horizontal rule

### Alur tulis
1. **Paling mudah:** buka `/admin/`, login pakai GitHub Access Token, klik **New Post**, publish. GitHub Pages deploy otomatis.
2. **Manual:** buat/edit file `.md`, jalankan `node tools/build-index.mjs`, lalu `git push`.

### Cara kerja data artikel
`blog.js` memuat `content/posts.json` lebih dulu, lalu menggabungkan daftar
`content/posts/` dari GitHub API untuk mengambil slug yang belum ada di manifest.
Ini membuat artikel dari CMS tetap muncul tanpa harus menjalankan script.
Cache disimpan di `localStorage` selama 10 menit (diabaikan di localhost).

### Penting
- `.nojekyll` wajib ada, kalau tidak Jekyll akan mengubah file `.md` ber-frontmatter menjadi HTML dan file mentahnya tidak ter-deploy.
- Path di `admin/config.yml` ditulis dari root repo (misal `/content/posts`), karena CMS berada di `/admin/`.

## Komunikasi
- Bahasa Indonesia untuk komunikasi dengan user
- Konten website (UI) menggunakan Bahasa Inggris

## Catatan
- Jangan tambah library/framework tanpa konfirmasi
- Screenshot preview bisa di-regenerate dengan membuka URL live demo proyek
- Sveltia CMS dimuat dari CDN (`unpkg.com`), jadi `/admin/` butuh koneksi internet
