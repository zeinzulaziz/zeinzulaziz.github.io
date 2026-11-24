---
title: "Prompt Engineering 101: Catatan dari Anthropic"
date: 2026-11-24
type: article
description: 'Ringkasan praktik menyusun prompt yang jelas, berkonteks, dan disempurnakan lewat iterasi — dari contoh analisis laporan kecelakaan sampai format output terstruktur.'
tags:
  - prompt engineering
  - AI
draft: false
---

## Ringkasan

Video ini dibawakan Hannah dan Christian dari tim Applied AI di Anthropic. Mereka membagikan praktik terbaik rekayasa prompt saat bekerja dengan model bahasa seperti Claude. Memakai contoh analisis laporan kecelakaan mobil Swedia, mereka menunjukkan cara membangun dan menyempurnakan prompt secara iteratif agar pemahaman, akurasi, dan kegunaan output meningkat.

---

## Ide dan konsep utama

- **Apa itu prompt engineering?** Praktik menulis instruksi dan konteks yang jelas serta terstruktur agar model bahasa menyelesaikan tugas secara efektif. Perlu pemikiran matang soal cara mengatur informasi.
- **Sifatnya iteratif dan empiris.** Prompt disempurnakan berdasarkan output dan kesalahan model untuk meningkatkan kinerja.
- **Skenario dunia nyata.** Perusahaan asuransi memproses klaim kecelakaan mobil dari dua input: formulir laporan kecelakaan dengan 17 kotak centang, dan sketsa buatan manusia yang menggambarkan kejadian.
- **Kesalahan umum saat memberi petunjuk awal.** Petunjuk yang naif bisa menyesatkan — misalnya Claude mengira kecelakaan itu insiden bermain ski karena kurangnya konteks.

## Metodologi: praktik terbaik membangun prompt yang efektif

1. **Tetapkan deskripsi tugas di awal.** Definisikan peran model dan tugas spesifik, misalnya membantu petugas klaim asuransi meninjau laporan kecelakaan mobil.
2. **Berikan konten atau konteks yang relevan.** Sertakan data input dinamis seperti formulir, gambar, dan sketsa.
3. **Tambahkan instruksi terperinci.** Beri panduan langkah demi langkah cara model memproses informasi dan bernalar.
4. **Sertakan contoh (few-shot learning).** Beri contoh konkret input dan output yang diharapkan, terutama untuk kasus rumit atau khusus.
5. **Ulangi dan tekankan informasi penting.** Perkuat detail atau batasan agar model tetap selaras dengan persyaratan tugas.
6. **Gunakan pemformatan terstruktur dan pembatas.** Atur prompt dengan tag XML atau Markdown agar model mudah mengurai dan merujuk bagian tertentu.
7. **Tambahkan informasi latar belakang statis di prompt sistem.** Detail yang tidak berubah — struktur formulir, arti kolom, bahasa — menghindari redundansi dan meningkatkan efisiensi.
8. **Kendalikan nada bicara dan kepercayaan diri.** Instruksikan model berpegang pada fakta dan menghindari tebakan atau halusinasi saat tidak yakin.
9. **Panduan urutan pemrosesan informasi.** Arahkan model menganalisis formulir lebih dulu, lalu sketsa, untuk meniru penalaran manusia.
10. **Berikan panduan pemformatan output.** Tentukan format akhir, misalnya membungkus putusan dalam tag XML atau JSON agar mudah diintegrasikan.
11. **Gunakan pemikiran yang diperluas atau penalaran hibrida.** Aktifkan kemampuan penalaran agar model "berpikir keras" — dapat meningkatkan akurasi dan memberi wawasan soal pengambilan keputusan.
12. **Riwayat percakapan dan pengayaan konteks (opsional).** Untuk aplikasi interaktif, sertakan riwayat percakapan yang relevan sebagai konteks tambahan.

## Ringkasan contoh langkah demi langkah dari demo

- **V1:** Petunjuk sederhana dengan konteks minimal → Claude salah mengira kecelakaan sebagai insiden bermain ski.
- **V2:** Menambahkan konteks tugas dan nada, memperjelas skenario kecelakaan mobil → Claude benar mengidentifikasi kecelakaan, tetapi masih ragu soal siapa yang bersalah.
- **V3:** Menambahkan latar belakang terperinci tentang struktur formulir dan instruksi di prompt sistem → Claude lebih memahami formulir dan menilai kesalahan lebih tepat.
- **V4:** Instruksi langkah demi langkah eksplisit agar Claude menganalisis formulir lebih dulu, lalu sketsa → Claude memeriksa setiap kotak centang dan memberi alasan rinci.
- **V5 (final):** Panduan format output dan pengingat kepercayaan diri → Claude menghasilkan putusan yang jelas, ringkas, dan terstruktur dalam tag XML yang siap dipakai aplikasi.

## Catatan tambahan

- Prompt engineering adalah ilmu empiris yang membutuhkan iterasi dan penyempurnaan terus-menerus.
- Prompt terstruktur dan instruksi yang jelas mengurangi halusinasi serta meningkatkan keandalan model.
- Contoh dan informasi latar belakang yang detail membantu model menangani input yang kompleks atau ambigu.
- Pemformatan output penting untuk mengintegrasikan hasil model ke dalam sistem produksi.
- Fitur penalaran yang diperluas di versi Claude yang lebih baru dapat meningkatkan transparansi dan akurasi.

## Pembicara / sumber

- **Hannah** — anggota tim Applied AI di Anthropic, presenter utama.
- **Christian** — anggota tim Applied AI di Anthropic, rekan presenter dan penjelas skenario.
- **Claude** — model bahasa yang dipakai untuk demonstrasi sepanjang video.
