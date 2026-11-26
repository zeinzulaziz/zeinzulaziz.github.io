# Detail chapter dan scroll-spy

Dokumen rujukan. Dimuat hanya saat menyentuh blok scroll-spy dan reveal di
`assets/css/style.css`, atau saat menambah/mengganti chapter di `index.html`.
Ringkasan ada di `AGENTS.md`.

## Keadaan sekarang: tanpa JavaScript

Highlight nav dikerjakan CSS scroll timeline. Tidak ada satu pun
`scroll` event yang membaca posisi halaman, dan tidak ada skrip fallback untuk
state chapter.

## Rantai yang dipakai

1. **Timeline per chapter.** Tiap chapter mendeklarasikan view timeline bernama
   sendiri, dan inset-nya dimatikan supaya timeline mengikuti kotak chapter, bukan
   `scroll-padding-top` header:

   ```css
   #opening  { view-timeline: --chapter-opening  block; }
   #projects { view-timeline: --chapter-projects block; }
   #about    { view-timeline: --chapter-about    block; }
   #contact  { view-timeline: --chapter-contact  block; }
   #opening, #projects, #about, #contact { view-timeline-inset: 0; }
   ```

2. **`timeline-scope` di `html`.** Nav berada di luar rantai ancestor chapter,
   jadi nama timeline harus diangkat ke dokumen dulu:

   ```css
   html {
     timeline-scope: --chapter-opening, --chapter-projects, --chapter-about,
       --chapter-contact;
   }
   ```

   Tanpa ini, `animation-timeline: --chapter-about` di nav tidak menemukan
   timeline-nya dan animasinya tidak pernah jalan.

3. **Jendela aktif: setengah viewport, bukan persentase.** Satu chapter aktif
   selama kotaknya menaungi tengah viewport. Dalam satuan scroll itu berarti
   `50svh` setelah chapter mulai masuk sampai `50svh` sebelum chapter selesai
   keluar — **panjangnya selalu sebesar tinggi chapter itu sendiri**, berapa pun
   tingginya. Karena itu rentangnya ditulis dalam satuan viewport dan tidak perlu
   disetel per-chapter:

   ```css
   animation-range: cover 48dvh cover calc(100% - 48dvh);
   ```

   `48dvh` = `50dvh` dikurangi `2dvh`: dua persen itu perluasan yang membuat
   bahu fade (pasangan chapter bersebelahan) bertemu tepat di perbatasan, bukan
   meninggalkan celah. `dvh`, bukan `svh`, supaya jendelanya ikut menyesuaikan
   saat toolbar browser mobile menyembunyikan diri.

4. **State dibawa lewat `--lit`, bukan lewat `color`.** `@property --lit`
   didaftarkan sebagai `<number>` (initial 0), sehingga bisa diinterpolasi
   animasi. Warnanya lalu dihasilkan `color-mix`:

   ```css
   color: color-mix(in srgb, var(--accent) calc(var(--lit) * 100%), var(--ink-soft));
   ```

   Kalau keyframes langsung menulis `color`, animasi akan menang atas
   `.nav-links a:hover` (animasi mengalahkan deklarasi normal apa pun, termasuk
   `:hover`). Menulis `--lit` membiarkan hover tetap hidup.

## Yang perlu diingat kalau mengubah chapter

- **Urutan dan nama `id` adalah kontrak.** Nav memakai `a[href$="#<id>"]`.
  Mengganti `id` berarti mengubah deklarasi `view-timeline`, daftar
  `timeline-scope`, dan selector per-link nav.
- **Chapter baru** butuh nama timeline unik, entri di `timeline-scope`, dan satu
  aturan `animation-timeline` untuk link nav-nya. Jendela rentangnya tidak perlu
  diubah: rumus `48dvh` berlaku untuk tinggi apa pun.
- **Semua aturan spy di-scope `body.home`.** `<body class="home">` hanya ada di
  `index.html`; halaman lain memuat nav yang sama tanpa chapter, dan tanpa scope
  itu animasinya mencari timeline yang tidak ada.
- **Spesifisitas adalah jebakan utama.** `animation` shorthand me-reset
  `animation-timeline` ke `auto`. Aturan yang memasang timeline harus benar-benar
  lebih spesifik daripada aturan yang memasang shorthand-nya (karena itu semua
  selector timeline diberi prefix `body.home`).

## Nav

- Nav di bawah 760px terlipat (`display: none`), tapi state-nya tetap benar:
  `--lit` sudah terhitung sejak menu dibuka.
- Chapter `opening` tidak punya link nav, jadi di puncak halaman tidak ada item
  nav yang menyala.
- Tidak ada event antar modul untuk babak ini.

## Reveal dan animasi scroll lain

Semua di CSS: garis progres header (`scroll(root block)`), header yang memadat,
`.reveal` lewat `view()`, dan word-rise di tipe display lewat `view-timeline:
--rise` pada mask tiap kata (inner element tidak bisa memegang timeline — mask-nya
sendiri yang jadi scrollport). `.reveal` terlihat secara default; animasinya hanya
hidup di dalam `@supports` + `prefers-reduced-motion: no-preference`, dan mati saat
tombol Motion dimatikan.

Semua chapter memegang named view timeline sendiri (`--chapter-opening` dan
teman-teman) supaya nav di luar chapter bisa membacanya untuk scroll-spy. Reveal
tetap memakai `view()` seperti biasa.

## Angka yang sudah diukur

Diuji lewat Chrome headless (viewport 1400×900, 1400×700, 1400×1200, 1100×800,
390×844): highlight nav cocok dengan aturan "chapter yang menaungi tengah
viewport" tanpa sample yang salah, dan tanpa momen di mana tidak ada yang menyala
atau dua menyala bersamaan — sisa selisih hanya satu-dua sample (20–35px scroll) di
perbatasan, yang memang lebar bahu fade. `cover 50%` juga diverifikasi sama persis
dengan titik pusat chapter bertemu pusat viewport.
