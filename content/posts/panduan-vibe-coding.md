---
title: "Panduan Vibe Coding: Aman dan Tidak Salah Arah"
date: 2026-11-24
type: article
description: 'Panduan praktis vibe coding: mulai dari spesifikasi satu halaman, jaga rahasia tidak bocor, batasi ruang lingkup AI, uji tanpa paham kode, dan checklist sebelum rilis.'
tags:
  - vibe coding
  - keamanan
  - panduan
draft: false
---

## A. Sebelum mulai

**1. Tulis spesifikasi singkat dulu (satu halaman).** Jangan langsung bilang "buatkan aplikasi X". Tulis:

- Tujuan aplikasi dalam 2-3 kalimat
- Siapa penggunanya
- Fitur wajib (maksimal 3-5 untuk versi pertama)
- Yang **tidak** dibuat dulu (ini yang mencegah melebar)
- Data apa yang disimpan, dan apakah ada data sensitif (email, nomor HP, pembayaran)

Simpan sebagai file `SPEC.md` di proyek, lalu minta AI selalu mengacu ke file itu.

**2. Minta rencana sebelum kode.**

> "Jangan tulis kode dulu. Buat rencana: struktur file, teknologi yang dipakai, dan alasannya. Saya bukan programmer, jadi jelaskan sederhana."

Baca rencananya. Kalau ada yang tidak masuk akal atau terlalu rumit untuk kebutuhan Anda, koreksi di tahap ini. Mengubah rencana jauh lebih murah daripada mengubah kode.

**3. Pilih teknologi yang umum dan sederhana.** Stack populer (misalnya Next.js, Supabase, atau PHP/Laravel biasa) punya banyak dokumentasi, jadi AI lebih jarang salah. Hindari teknologi langka atau terlalu baru.

## B. Mencegah kebocoran

Ini bagian yang paling sering luput karena tidak terlihat di tampilan.

**1. Rahasia tidak boleh ada di kode.** API key, password database, dan token harus disimpan di file `.env`, bukan ditulis langsung di kode. Pastikan `.env` masuk ke `.gitignore`.

**2. Jangan tempel rahasia ke chat AI.** Kalau perlu menunjukkan konfigurasi, ganti nilainya dengan placeholder (`API_KEY=xxxx`).

**3. Pahami beda frontend dan backend.** Apa pun yang ada di sisi frontend (yang berjalan di browser) bisa dilihat siapa saja lewat "Inspect". API key yang bersifat rahasia **hanya boleh dipakai di backend/server**. Minta AI memastikan ini.

**4. Cek repository sebelum publik.**

- Repo GitHub sebaiknya **private** kecuali memang open source.
- Kalau pernah tidak sengaja meng-commit key, **anggap key itu sudah bocor**: ganti dengan yang baru. Menghapus file saja tidak cukup karena riwayat Git menyimpannya.

**5. Batasi hak akses key.** Buat API key dengan izin sekecil mungkin dan pasang batas pengeluaran (spending limit) di layanan berbayar, supaya kalau bocor kerugiannya terbatas.

**6. Kalau memakai database (misalnya Supabase/Firebase):** pastikan aturan akses (Row Level Security / security rules) aktif. Database yang terbuka tanpa aturan adalah penyebab kebocoran data yang paling umum di proyek vibe coding.

## C. Mencegah salah arah selama pengembangan

**1. Pakai Git dari awal.** Setiap kali satu fitur berfungsi, simpan (commit) dengan pesan jelas, misalnya "login berhasil". Ini titik aman untuk kembali kalau perubahan berikutnya merusak. Minta AI mengajari perintah dasarnya.

**2. Satu perubahan per permintaan.** Jangan minta "tambah login, dashboard, dan pembayaran" sekaligus. Kerjakan satu, uji, simpan, baru lanjut.

**3. Batasi ruang lingkup di setiap permintaan.**

> "Ubah hanya bagian tombol simpan. Jangan ubah file lain dan jangan refactor apa pun."

AI cenderung "merapikan" bagian lain yang tidak diminta, dan di situlah bug baru muncul.

**4. Minta ringkasan setelah setiap perubahan.**

> "Sebutkan file mana yang diubah dan apa yang berubah, dalam bahasa sederhana."

**5. Jangan menumpuk perbaikan di atas perbaikan.** Kalau AI sudah tiga kali gagal memperbaiki satu bug, berhenti. Kembali ke titik aman terakhir di Git dan ulangi dengan prompt yang lebih jelas, atau mulai percakapan baru dengan ringkasan masalahnya.

**6. Jaga konteks tetap bersih.** Percakapan yang sangat panjang membuat AI lupa keputusan awal. Mulai sesi baru per fitur dan sertakan `SPEC.md` di awal.

**7. Waspadai dependensi (library) asing.** Kalau AI menambah library baru, tanyakan: "Kenapa library ini perlu? Apakah populer dan masih dirawat?" Nama library yang tidak dikenal atau salah ketik kadang jebakan.

## D. Pengujian tanpa perlu paham kode

Uji bukan hanya jalur normal:

- Form dikosongkan, diisi angka negatif, teks sangat panjang, karakter aneh (`<script>`, tanda kutip)
- Klik tombol dua kali dengan cepat
- Refresh di tengah proses
- Buka di HP dan browser lain
- **Uji akses antar pengguna:** login sebagai user A, lalu coba buka data user B (misalnya dengan mengubah ID di URL). Kalau bisa terbuka, itu celah serius.
- Coba tanpa login: apakah halaman yang seharusnya tertutup masih bisa dibuka?

Lalu minta AI meninjau:

> "Review kode ini seperti auditor keamanan. Cari: rahasia yang terekspos, input yang tidak divalidasi, halaman tanpa pengecekan login, dan akses data antar pengguna. Urutkan dari yang paling berbahaya."

Lakukan ini **di percakapan baru** supaya AI tidak membela kodenya sendiri.

## E. Template prompt yang bisa dipakai

**Awal proyek:**

```
Saya non-programmer. Baca SPEC.md. Jangan tulis kode dulu.
Buat rencana: struktur file, teknologi, dan langkah bertahap.
Jelaskan dengan bahasa sederhana dan sebutkan risiko keamanan
yang perlu saya perhatikan.
```

**Setiap fitur:**

```
Fitur: [satu fitur saja].
Ubah hanya file yang diperlukan. Jangan ubah fitur lain.
Setelah selesai, sebutkan file yang diubah, cara mengujinya,
dan kasus yang belum ditangani.
```

**Saat bug:**

```
Gejala: [apa yang terjadi]. Seharusnya: [apa yang diharapkan].
Pesan error: [tempel persis].
Jelaskan penyebabnya dulu sebelum memperbaiki.
Perbaiki seminimal mungkin.
```

## F. Checklist sebelum rilis ke publik

- [ ] Tidak ada API key, password, atau token di kode maupun riwayat Git
- [ ] `.env` masuk `.gitignore`; key rahasia hanya dipakai di backend
- [ ] Repo private (atau sengaja publik dan sudah dicek isinya)
- [ ] Aturan akses database aktif dan sudah diuji antar pengguna
- [ ] Halaman yang tertutup tidak bisa dibuka tanpa login
- [ ] Semua input form divalidasi
- [ ] Spending limit terpasang di layanan berbayar
- [ ] Ada backup data dan titik aman di Git
- [ ] Sudah direview keamanan oleh AI di percakapan baru
- [ ] Kalau menyimpan data pribadi atau menerima pembayaran: minta orang yang paham kode ikut memeriksa, dan pakai penyedia pembayaran resmi (jangan buat sistem pembayaran sendiri)

## Batasannya

Panduan ini mengurangi risiko, tidak menghilangkannya. AI bisa yakin sekali padahal salah, dan review oleh AI bukan pengganti pemeriksaan manusia untuk aplikasi yang menyangkut uang atau data pribadi. Untuk alat pribadi atau prototipe, panduan ini sudah cukup. Untuk produk yang dipakai orang banyak, anggap panduan ini sebagai batas minimum.
