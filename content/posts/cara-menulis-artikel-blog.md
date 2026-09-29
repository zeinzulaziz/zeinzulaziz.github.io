---
title: "Cara Menulis Artikel Blog di Situs Ini"
slug: "cara-menulis-artikel-blog"
date: 2026-09-29
type: article
description: "Panduan singkat cara membuat artikel atau catatan baru lewat editor di /admin, tanpa perlu sentuh kode."
tags: ["blog", "guide", "sveltia-cms"]
draft: false
---

Blog ini sengaja dibuat tanpa build tool. Tidak ada Node, tidak ada bundler, tidak ada
`npm install` — cukup edit file `.md` di repo, dan artikelnya tayang.

## Menulis lewat editor visual

Buka `https://zeinzulaziz.github.io/admin/`, login pakai **Sign In Using Access Token**
(tempel GitHub Personal Access Token), lalu klik **New Post**. Isi field-nya:

- **Title** — judul artikel
- **Slug** — penanda URL, huruf kecil dan tanda hubung: `cara-menulis-artikel`
- **Date** — tanggal terbit
- **Description** — 1–2 kalimat, muncul di daftar artikel
- **Tags** — label bebas, misal `wordpress` atau `javascript`
- **Body** — isi artikel dalam Markdown

Klik **Publish**, tunggu GitHub Pages selesai deploy, artikel langsung muncul.

## Menulis langsung dari file

Kalau lebih nyaman pakai editor teks, buat file baru di `content/posts/`:

```markdown
---
title: "Judul Artikel"
slug: "judul-artikel"
date: 2026-09-29
type: article
description: "Ringkasan singkat."
tags: ["catatan"]
draft: false
---

Isi artikel ditulis di sini.
```

Nama file harus sama dengan nilai `slug`, lalu jalankan
`node tools/build-index.mjs` dan `git push`. Selesai.

## Menulis catatan cepat

Isi `type` dengan `note` kalau hanya catatan singkat. Catatan tetap tampil seperti
artikel, cuma ada aksen garis kuning di sisi kirinya.

> Setel `draft: true` untuk menyembunyikan artikel dari pengunjung selama masih
> dikerjakan.

## Format yang didukung

Heading, **tebal**, *miring*, `kode inline`, daftar, blockquote, tabel, tautan, gambar,
dan blok kode:

```js
const config = {
  posts: "content/posts/*.md",
  buildTool: null,
};
```

Singkat saja — tidak perlu ribet. Tulis, publish, selesai.
