# Detail chapter, rail, dan scroll-spy

Dokumen rujukan. Dimuat hanya saat menyentuh blok scroll-spy dan reveal di
`assets/css/style.css`, atau saat menambah/mengganti chapter di `index.html`.
Ringkasan ada di `AGENTS.md`.

## Keadaan sekarang: tanpa JavaScript

Rail chapter, highlight nav, dan scroll cue dikerjakan CSS scroll timeline. Tidak
ada satu pun `scroll` event yang membaca posisi halaman di browser modern.
`assets/js/journey.js` hanya dimuat sebagai jaring pengaman, dan hanya kalau
`CSS.supports("animation-timeline", "view()")` atau
`CSS.supports("timeline-scope", "--x")` gagal (lihat inline script di akhir
`index.html`).

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

2. **`timeline-scope` di `html`.** Rail, nav, dan scroll cue berada di luar
   rantai ancestor chapter, jadi nama timeline harus diangkat ke dokumen dulu:

   ```css
   html {
     timeline-scope: --chapter-opening, --chapter-projects, --chapter-about,
       --chapter-contact;
   }
   ```

   Tanpa ini, `animation-timeline: --chapter-about` di dalam rail tidak
   menemukan timeline-nya dan animasinya tidak pernah jalan.

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
   color: color-mix(in srgb, var(--accent) calc(var(--lit) * 100%), var(--rail-ink));
   ```

   Kalau keyframes langsung menulis `color`, animasi akan menang atas
   `.chapter-rail a:hover` dan `.nav-links a:hover` (animasi mengalahkan
   deklarasi normal apa pun, termasuk `:hover`). Menulis `--lit` membiarkan
   keduanya hidup. Ini juga alasan `.is-current` masih ada: kelas itu yang dipakai
   `journey.js` di browser tanpa scroll timeline, dan tetap menang lewat
   spesifisitas tanpa bertabrakan dengan animasi.

5. **Bar rail dan label.** `::after` (rule 3rem) di-scale ke `0.4667` untuk
   keadaan diam — `transform` bisa di-composite, `width` akan memicu layout tiap
   frame. Angka `0.4667` adalah 1.4rem dibagi 3rem: ukuran rule yang lama.

## Yang perlu diingat kalau mengubah chapter

- **Urutan dan nama `id` adalah kontrak.** Rail memakai `a[href="#<id>"]` dan nav
  memakai `a[href$="#<id>"]`. Mengganti `id` berarti mengubah empat tempat:
  deklarasi `view-timeline`, daftar `timeline-scope`, selector per-link rail, dan
  selector per-link nav.
- **Chapter baru** butuh nama timeline unik, entri di `timeline-scope`, dan satu
  aturan `animation-timeline` untuk rail + nav-nya. Jendela rentangnya tidak perlu
  diubah: rumus `48dvh` berlaku untuk tinggi apa pun.
- **Semua aturan spy di-scope `body.home`.** `<body class="home">` hanya ada di
  `index.html`; halaman lain memuat nav yang sama tanpa chapter, dan tanpa scope
  itu animasinya mencari timeline yang tidak ada.
- **Spesifisitas adalah jebakan utama.** `animation` shorthand me-reset
  `animation-timeline` ke `auto`. Aturan yang memasang timeline harus benar-benar
  lebih spesifik daripada aturan yang memasang shorthand-nya (karena itu semua
  selector timeline diberi prefix `body.home`).

## Rail, nav, dan cue

- Rail chapter tampil ≥1240px saja. Nav di bawah 760px terlipat (`display: none`),
  tapi state-nya tetap benar: `--lit` sudah terhitung sejak menu dibuka.
- Highlight nav memakai mekanisme yang sama persis, jadi rail dan nav tidak pernah
  berbeda pendapat. Chapter `opening` tidak punya link nav, jadi di puncak halaman
  tidak ada item nav yang menyala — sama seperti perilaku lama.
- Scroll cue memakai timeline `--chapter-opening` dengan rentang
  `calc(100% - 68dvh)` → `calc(100% - 48dvh)`, yaitu dua puluh viewport-percent
  terakhir sebelum chapter opening berhenti jadi chapter aktif. Cue adalah satu-
  satunya yang masih pakai persentase relatif, karena ia perlu fade yang panjang,
  bukan switch.
- `aria-current` tidak dikelola di rail — sengaja. Rail adalah penanda posisi,
  bukan kontrol navigasi, dan CSS tidak bisa menulis atribut.
- Tidak ada event antar modul untuk babak ini. `themechange` masih
  dipancarkan `site.js`, tapi tidak ada yang mendengarkannya.

## Reveal dan animasi scroll lain

Semua di CSS: garis progres header (`scroll(root block)`), header yang memadat,
`.reveal` lewat `view()`, dan word-rise di tipe display lewat `view-timeline:
--rise` pada mask tiap kata (inner element tidak bisa memegang timeline — mask-nya
sendiri yang jadi scrollport). `.reveal` terlihat secara default; animasinya hanya
hidup di dalam `@supports` + `prefers-reduced-motion: no-preference`, dan mati saat
tombol Motion dimatikan.

Satu pengecualian penting: reveal di dalam chapter yang di-pin memakai timeline
chapter (`#opening .pin .reveal` → `--chapter-opening`, begitu pula contact),
karena `view()` membeku selama pin menahan posisi.

## Angka yang sudah diukur

Diuji lewat Chrome headless (viewport 1400×900, 1400×700, 1400×1200, 1100×800,
390×844): state rail dan nav cocok dengan aturan "chapter yang menaungi tengah
viewport" tanpa sample yang salah, dan tanpa momen di mana tidak ada yang menyala
atau dua menyala bersamaan — sisa selisih hanya satu-dua sample (20–35px scroll) di
perbatasan, yang memang lebar bahu fade. `cover 50%` juga diverifikasi sama persis
dengan titik pusat chapter bertemu pusat viewport.
