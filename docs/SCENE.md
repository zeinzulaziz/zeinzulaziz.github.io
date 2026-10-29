# Detail adegan gerhana (scene.js & journey.js)

Dokumen rujukan. Dimuat hanya saat menyentuh `assets/js/scene.js` atau
`assets/js/journey.js`. Ringkasan ada di `AGENTS.md`.

- Hero digambar oleh `scene.js` (three.js yang di-vendor di `assets/vendor/three/`).
  Isinya: bola bulan 3D (permukaan dipindahkan jadi 23 cekungan), tiga instrumen
  cincin miring (torus kuningan, hair ring, 80 tick instanced, plus boom dan
  mutiara), korona di bidang belakang, dan medan bintang di frustum yang sama.
  Tidak ada tekstur gambar: albedo bulan dibuang, jadi bentuknya yang membaca.
  Pencahayaan = key hangat + fill dingin + hemisphere + lampu titik yang duduk
  **di dalam** bola (hanya instrumen yang bisa melihatnya), ditambah environment
  map yang dibuat saat boot: ruang gelap dengan enam panel emissive, di-PMREM.
  Environment itulah yang mengangkat badan bulan ke sekitar #231f1d dan memberi
  kilau pada kuningan. Palet dibaca dari token CSS (`--scene-core`,
  `--scene-glow`, `--scene-body`), jadi tema terang/gelap memakai satu
  implementasi. `scene.js` menambah kelas `is-ready` ke `.scene` setelah
  membuktikan adegan benar-benar menggambar (baca balik pixel di titik bulan).
- Komposisi mengikuti frame pembuka referensi (umbra): satu bulan gelap besar,
  tiga cincin instrumen, korona hangat dengan streamer. Tata panggungnya juga
  dipinjam: instrumen membuka, badan dilepas, lalu kembali sejajar. Yang **tidak**
  diambil: lensa kaca, diafragma, koridor, penerbangan kamera menembus cincin,
  post-processing, dan layar loading.
- Scroll adalah jam adegan. `journey.js` mengirim `stage` kontinu dari kotak
  chapter: 0 saat opening, 1 ketika bagian atas #projects melewati 35% viewport,
  2 untuk about, 3 untuk contact. Semua gerakan di `scene.js` adalah jendela
  smoothstep pada nilai itu (`unfold` 0.28–0.95, `release` 0.40–1.00, `dim`
  0.30–0.70, `edgeOn` 1.45–1.95, `restore` 2.70–2.95, `back` 2.80–3.00, `glow`
  2.86–3.00), jadi tidak ada keyframe waktu dan scroll balik mengulang bentuk
  yang sama. Garis yang tak bisa dicapai scroll (chapter lebih pendek dari
  viewport, atau pin mati) dihitung sebagai garis terakhir yang bisa dicapai,
  supaya frame penutup tetap utuh di dasar halaman. Empat frame:
  opening/contact = instrumen penuh + bulan + korona; work = cincin menghadap
  kamera jadi terowongan dangkal, instrumen mengecil ke 0.64 dan meredup ke 0.42
  di margin kanan, bulan mengecil jadi titik dan korona mati; about = cincin
  berputar edge-on (`rotation.x` 1.34) jadi lensa 0.58. Nilai `stage` dikejar
  `1 − e^(−7dt)` di loop; saat motion off diterapkan langsung.
- Tata letak bulan: lebar `WIDE = { size: 0.45, x: 0.775, y: 0.455 }`, sempit
  `NARROW = { size: 0.165, x: 0.9, y: 0.235 }`, diblend dengan smoothstep pada
  aspek viewport (0.70 → 1.05). Cincin dan boom hanya hidup di komposisi lebar
  (`portrait < 0.5`); di komposisi sempit bulannya jadi tanda di pojok kanan,
  sengaja menyentuh tepi frame, dan koronanya dipersempit (`uSpread` 0.4).
  Kamera digeser, bukan diputar, supaya pusatnya persis (bola selalu bulat dari
  sudut mana pun). Angka yang sama dipakai `.still-eclipse` di CSS dan
  `probe-fit.mjs`: ubah satu, ubah semuanya.
- Korona: satu shader, dua bacaan. Malam = additive (hairline chalk di dalam halo
  tembaga); siang = premultiplied normal blending, `uDay = 1` menahan halo ke
  0.05, melebarkan hairline (`mix(170.0, 90.0, uDay)`) karena yang terlihat cuma
  sliver di luar siluet, dan mematikan bintang.
- Fallback tanpa JS/WebGL: `.still-eclipse` (CSS saja) tetap ada di markup. Saat
  `is-ready`, elemen ini disembunyikan — lewat transisi CSS **dan** `display: none`
  dari JS, karena tab yang di-background tidak menjalankan transisi. Tanpa WebGL,
  cakramnya ikut memudar saat chapter tengah aktif dan kembali di contact
  (`data-chapter-active`), meniru alur adegan sejauh yang bisa dilakukan CSS.
- Empat chapter (`#opening`, `#projects`, `#about`, `#contact`) diberi nomor dan
  ditandai oleh `journey.js`; rail chapter hanya tampil di layar ≥1240px.
- Animasi dihormati: `prefers-reduced-motion` dan tombol "Motion on/off" mematikan
  pin, reveal, dan loop render (adegan digambar sekali sebagai still). Stage tetap
  mengikuti scroll, hanya tanpa easing.
- Paralaks pointer hanya memutar grup bintang; bulan tak pernah bergeser dari
  angka tata letaknya, jadi pengukuran kontras dan `probe-fit` tetap berlaku di
  semua posisi scroll. Yang berubah saat scroll cuma skala/tilt/opasitas
  instrumen dan skala bulan.
- Kontrak antar modul lewat event di `document`: `themechange`, `motionchange`,
  `journey` (`progress`, `active`, `stage`), `contentchange` (daftar proyek
  selesai dimuat).
- Reveal bersifat opsional: `.js .reveal` baru disembunyikan kalau JS jalan, dan
  `main.js` punya jaring pengaman yang menampilkan apa pun yang ada di viewport
  kalau observer gagal atau tertunda.
