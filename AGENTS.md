# AGENTS.md — Portfolio GitHub Pages

## Konteks Project
Landing page portofolio statis yang di-deploy ke GitHub Pages: https://zeinzulaziz.github.io/

## Stack
- Vanilla HTML, CSS, JavaScript (tanpa framework); build script kecil pakai Node (tanpa dependensi)
- Daftar proyek dari snapshot `content/repos.json` (sebelumnya GitHub API langsung)
- CMS: Sveltia CMS (drop-in Decap/Netlify CMS) dari CDN, backend GitHub + Access Token

## Struktur
- `index.html` — halaman utama
- `blog.html` — daftar artikel
- `post.html?slug=<slug>` — fallback render client untuk link lama (link baru pakai `post/<slug>/`)
- `post/<slug>/index.html` — artikel prerender (hasil build, jangan edit manual)
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
- `assets/js/main.js` — logika & data proyek (baca `content/repos.json`)
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

## Halaman utama: gerhana & chapter
- Hero digambar oleh `scene.js` (three.js yang di-vendor di `assets/vendor/three/`):
  bola bulan 3D — permukaannya dipindahkan jadi kawah dan maria, albedonya digambar
  di canvas saat boot — diterangi dua sumber hangat (satu di depan bahu kanan atas,
  satu menyapu sisi jauh supaya siluetnya tetap ada), ditambah bidang korona di
  belakangnya dan bintang di frustum yang sama. Paletnya dibaca dari token CSS
  (`--scene-core`, `--scene-glow`, `--scene-body`), jadi tema terang/gelap memakai
  satu implementasi. `scene.js` menambah kelas `is-ready` ke `.scene` setelah
  membuktikan adegan benar-benar menggambar (baca balik pixel di titik bulan).
- Tata letak bulan: lebar `WIDE = { size: 0.30, x: 0.775, y: 0.44 }`, sempit
  `NARROW = { size: 0.165, x: 0.875, y: 0.225 }`, diblend dengan smoothstep pada
  aspek viewport (0.70 → 1.05). Kamera digeser, bukan diputar, supaya pusatnya persis
  (bola selalu bulat dari sudut mana pun). Angka yang sama dipakai `.still-eclipse`
  di CSS dan `probe-fit.mjs`: ubah satu, ubah semuanya.
- Fallback tanpa JS/WebGL: `.still-eclipse` (CSS saja) tetap ada di markup. Saat
  `is-ready`, elemen ini disembunyikan — lewat transisi CSS **dan** `display: none`
  dari JS, karena tab yang di-background tidak menjalankan transisi.
- Empat chapter (`#opening`, `#projects`, `#about`, `#contact`) diberi nomor dan
  ditandai oleh `journey.js`; rail chapter hanya tampil di layar ≥1240px.
- Animasi dihormati: `prefers-reduced-motion` dan tombol "Motion on/off" mematikan
  pin, reveal, dan loop render (adegan digambar sekali sebagai still).
- Paralaks pointer hanya memutar grup bintang; progres `journey` hanya meredupkan
  korona (1 → 0.42) — bulan tak pernah bergeser dari angka tata letaknya, jadi
  pengukuran kontras dan `probe-fit` tetap berlaku di semua posisi scroll.
- Kontrak antar modul lewat event di `document`: `themechange`, `motionchange`,
  `journey` (progres scroll), `contentchange` (daftar proyek selesai dimuat).
- Reveal bersifat opsional: `.js .reveal` baru disembunyikan kalau JS jalan, dan
  `main.js` punya jaring pengaman yang menampilkan apa pun yang ada di viewport
  kalau observer gagal atau tertunda.

## Komunikasi
- Bahasa Indonesia untuk komunikasi dengan user
- Konten website (UI) menggunakan Bahasa Inggris

## Catatan
- Jangan tambah library/framework tanpa konfirmasi
- Screenshot preview bisa di-regenerate dengan membuka URL live demo proyek
- Sveltia CMS dimuat dari CDN (`unpkg.com`), jadi `/admin/` butuh koneksi internet
- Analytics: GoatCounter (privacy-friendly, opt-in). Aktifkan dengan mengisi kode situs di `ANALYTICS` dalam `assets/js/site.js`; kosong = mati
- Font self-hosted (assets/fonts, SIL OFL). Kalau ganti/gaya font, ubah `@font-face` di `style.css` — jangan tarik Google Fonts lagi
