---
title: "Catatan: Kenapa Tanpa Build Tool"
slug: "kenapa-tanpa-build-tool"
date: 2026-09-29
type: note
description: "Catatan kecil soal kenapa blog ini sengaja dibuat sesederhana mungkin."
tags: ["catatan", "web"]
draft: false
---

Situs ini statis, tanpa Node, tanpa bundler, tanpa proses build sama sekali.

Alasannya sederhana: yang penting justru **kemudahan menulis**. Kalau harus
`npm install` dulu sebelum bisa nulis catatan, kemungkinan besar catatannya
tidak pernah ditulis.

- Konten: file Markdown di `content/posts/`
- Deploy: `git push`, GitHub Pages yang menangani
- Editor: Sveltia CMS di `/admin/`
