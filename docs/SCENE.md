# Detail adegan hero (journey.js & .still-eclipse)

Dokumen rujukan. Dimuat hanya saat menyentuh `assets/js/journey.js` atau bagian
hero di `assets/css/style.css`. Ringkasan ada di `AGENTS.md`.

- Hero punya satu ilustrasi saja: `.still-eclipse` (CSS) — satu radial gradient
  dan satu box-shadow di `.scene`, tanpa gambar, tanpa JS. Situs ini dulu
  membawa gerhana WebGL tiga berkas (~187 KB gzip); dihapus November 2026 dan
  stand-in CSS itulah yang tinggal.
- Token tetap dibaca dari palet (`--scene-core`, `--scene-glow`,
  `--scene-body`), jadi tema gelap/terang tetap satu implementasi. Di tema
  gelap korona dibaca sebagai hairline cream di dalam halo tembaga; di tema
  terang, sebagai slivers tembaga di atas cream.
- Tata letak di CSS: lebar layar → pusat di 77.5% × 45.5% dengan diameter
  `min(45svh, 44vw)`; komposisi sempit (`max-aspect-ratio: 1/1`) → pojok kanan
  atas di 90% × 23.5% dengan `min(16.5svh, 30vw)`. Tidak ada blend smoothstep
  atau breakpoint tengah — nilainya langsung dua.
- `journey.js` hanya menjawab pertanyaan "chapter mana yang sedang di tengah
  viewport?". Jawabannya ditulis ke `data-chapter-active` di `<html>` dan
  dipakai CSS untuk dua hal: menyembunyikan scroll cue setelah chapter opening
  lewat, dan memudar cakram selama chapter tengah aktif (kembali di contact).
  Apa pun selain itu bukan urusannya.
- Rail chapter (≥1240px) di-update oleh `journey.js` lewat kelas `is-current`
  (lebar rule + warna). Atribut `aria-current` tidak dikelola lagi — sengaja:
  CSS tidak bisa menulis atribut, dan rail adalah penanda posisi, bukan kontrol
  nav.
- Tidak ada event antar modul untuk adegan ini. `themechange`/`motionchange`
  tetap diproduksi oleh `site.js` (dipakai reveal/header dan scene lama dulu) —
  murni state, bukan animasi.
- Reveal, garis progres header, header yang memadat, dan word-rise di tipe
  display dikerjakan CSS scroll timeline (`animation-timeline: scroll()/view()`),
  bukan JavaScript. `.reveal` terlihat secara default; animasinya hanya hidup
  di dalam `@supports` + `prefers-reduced-motion: no-preference`, dan mati saat
  tombol Motion dimatikan. Reveal di dalam chapter yang di-pin memakai timeline
  chapter (`--chapter`), karena `view()` membeku selama pin.
- `data-chapter-active` hanya ada di halaman utama; halaman lain tidak memicu
  `journey.js` sama sekali (chapter list kosong → keluar tanpa kerja).
