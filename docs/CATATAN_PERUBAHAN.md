# Catatan perubahan & keputusan

Urut terbaru di atas. Tiap entri: apa, kenapa, keputusan pemilik, dan yang masih terbuka.
Detail teknis ada di pesan commit (`git show <hash>`) dan di `INTEGRASI_CORE.md`.

---

## 6 Oktober 2026 — Perbaikan mobile `/daftar`

- **Layar zoom saat mengetik** (iOS Safari): kolom isian `text-sm` (14px) memicu zoom otomatis saat fokus.
  `fieldClass` kini `text-base sm:text-sm` (16px di ponsel). JANGAN menurunkan isian di bawah 16px di
  ponsel, dan jangan menonaktifkan zoom lewat meta viewport (aksesibilitas). `WilayahSelect` sudah 16px.
- **Bar bayar ponsel dikembalikan** ke bentuk semula: total di kiri, tombol "Bayar" pendek di kanan,
  "Powered by" di bawahnya. Versi bertumpuk (tombol selebar penuh di tengah) dibatalkan atas permintaan
  pemilik — tombol bayar ponsel sengaja rata kanan.
- **Celah privasi lama ditutup:** form tanpa `method` mengirim GET biasa bila tombol ditekan sebelum
  hidrasi selesai, sehingga nama/email/WhatsApp masuk URL dan riwayat lalu halaman memuat ulang dengan
  isian kosong (terlihat sebagai "kotak bayar bug" di koneksi lambat). Tombol bayar kini bertipe `button`
  sampai hidrasi selesai (`useSyncExternalStore`), lalu `submit`. Diuji: HTML server berisi `type="button"`,
  setelah hidrasi validasi berjalan dan URL tetap bersih; lebar 320px dan 375px tanpa overflow.

---

## 6 Oktober 2026 — Tema "Warm Editorial": hangat, elegan, minimalis

Nama tema untuk dirujuk agent lain: **Warm Editorial**. Ini penajaman dari entri "Penyegaran UI
hangat dan minimalis" di bawahnya. Arah futuristik SENGAJA dibuang karena bertabrakan dengan
kehangatan; jangan menambahkannya lagi (motif data-readout, aksen dingin, dst).

**Keputusan pemilik**
- Tipografi: **hanya Plus Jakarta Sans** — memberi kesan tenang dan dewasa. Serif (Fraunces) sempat
  dicoba lalu dibuang; Oswald juga sudah dicopot. `.font-display` kini = Plus Jakarta Sans.
  Judul besar memakai bobot medium–semibold dengan letter-spacing rapat. Tidak ada teks miring.
- Judul hero tetap **SMADARUN huruf kapital penuh** (`heroDetails.heading`).
- Teks hero (tagline, subjudul, tombol) **tetap rata kiri** karena sorotan foto ada di sisi kanan;
  bayangan foto berupa gradien dari kiri. Jangan dipindah ke tengah.
- Semua CTA lain **rata tengah** dalam pembungkusnya (tombol tiket, CTA penutup, tombol bayar).
- Nominal hadiah dan teks "2026" di foto galeri dibiarkan: itu dokumentasi tahun lalu.

**Yang berubah**
- Palet: amber diganti champagne-madu (`--primary` 228 195 140, `--primary-accent` 188 144 80);
  mode gelap jadi cokelat kopi hangat, bukan abu-abu netral.
- Kartu dikurangi: Fasilitas = daftar bergaris tipis bernomor `01–06`; Testimoni = kutipan terbuka
  tanpa kotak; kotak putus-putus di Tiket diganti garis tipis; kartu tiket, form, dan ringkasan
  datar (tanpa `shadow-rest`). Panel gelap (hari lomba, CTA penutup) dipertahankan.
- Komponen baru `src/components/Eyebrow.tsx`: label kecil berspasi + garis emas di atas judul tiap
  seksi (Fasilitas, Galeri, Kategori, Cerita pelari, Bantuan, Sponsor) dan di kepala `/daftar`.
  `SectionTitle` kini memakai gaya judul baru (semibold, `tracking-[-0.03em]`, sampai `lg:text-5xl`).
- Foto: kelas `.photo-warm` (sepia/saturasi tipis) di hero dan galeri; galeri memakai radius baru
  `rounded-photo` dan keterangan per foto (`caption` di `src/data/gallery.ts`, wajib diisi).
  Foto galeri semuanya `loading="lazy"`.
- Satu gaya caption: "NB: Pembayaran online · Konfirmasi otomatis" tidak lagi miring, 12px.
  Kicker hero 12px (13px di `sm`).
- Tombol CTA: kolom kiri kartu tiket rata tengah; "Lanjut ke pembayaran" selebar kartu ringkasan;
  bar bawah ponsel di `/daftar` disusun ulang (total di atas, tombol "Bayar" selebar penuh di tengah).
- Dirapikan agar seragam: sponsor, `/daftar` (judul & kartu), halaman status, halaman error, skeleton.
- Setelah `git pull`: `public/images/hero3–7.JPG` identik dengan yang di commit (aman ditimpa).

**Seksi baru "Rute, Jersey & Medali" (`Flyer`, id `#flyer`)** — tempat flyer dari panitia, dipasang
setelah Fasilitas. Keputusan: **portrait 4:5 (1080×1350), satu flyer per topik** (bukan satu gambar
gabungan) agar terbaca di ponsel dan mudah diganti satu per satu; rasio lain tetap didukung karena
tiap flyer memakai dimensi aslinya. Cara memasang ada di komentar kepala `src/data/flyer.ts`: taruh
file di `public/images/flyer/`, lalu isi `src`, `width`, `height` pada item-nya. Selama `src` kosong
tampil kotak "Flyer segera hadir" (4:5). Ponsel = carousel geser, desktop = grid, klik = lightbox + zoom.
Diuji di browser dengan gambar contoh sementara (sudah dikembalikan kosong). Seksi Tiket juga kini
menyesuaikan teks bila hanya ada satu kategori ("Amankan tempatmu" / label "Tiket").

**Favicon & OG image** — disiapkan lewat konvensi file Next.js (`src/app/icon.png`, `apple-icon.png`,
`favicon.ico`, `opengraph-image.jpg`, `twitter-image.jpg`); skrip `scripts/pasang-ikon.sh` membuat tiga
ikon dari satu PNG persegi. Panduan: `docs/PANDUAN_ASET.md`. Ditemukan: favicon masih sidik jari bawaan
template dan `layout.tsx` menunjuk `/images/og-image.jpg` + `twitter-image.jpg` yang tidak ada (404) —
referensi rusak itu dihapus dari `layout.tsx`. Sebelum file OG dipasang, tidak ada tag `og:image`.
Diuji dengan file sementara (tag muncul, ukuran terbaca otomatis), sudah dikembalikan.

**Tempat logo SMADA (sekolah) dan SMADARUN (event)** — diisi lewat `src/data/logo.ts` (petunjuk di
komentar kepalanya; file di `public/images/logo/`). Logo kecil, tanpa lightbox. Penempatan: logo
event di header (depan tulisan "SMADARUN 2027") + footer; logo sekolah di depan kicker hero
"SMA Negeri 2 Nganjuk mempersembahkan" (menggantikan garis emas) + footer ("Diselenggarakan oleh").
Selama `src` kosong tidak ada yang tampil (tidak ada kotak kosong); situs memakai tampilan teks.
Flag `sembunyikanTeksHeader` untuk logo event yang sudah memuat tulisan. Komponen: `BrandLogo.tsx`.
Diuji di browser dengan logo contoh sementara (sudah dikembalikan kosong).

**Countdown "Menuju hari lomba" sudah terhubung ke core.** `EventInfo.tsx` → `getLiveEventData()` →
`event.event_date` dari kembarin-v2 (revalidate 30 detik, halaman `/` ikut). Begitu super admin
mengisi tanggal event di kembar.in, hitung mundur muncul sendiri (maks. ±30 detik); tanggal, lokasi,
gun start (hanya jarak yang kategorinya aktif), dan jadwal RPC di panel yang sama juga live. Kalau
tanggal kosong, panel menampilkan "Tanggal hari-H segera diumumkan". Tidak ada tanggal di-hardcode
di situs ini. Belum diuji dengan tanggal asli dari core production — hanya dibaca dari kodenya.

**Masih terbuka:** konten sample (testimoni, statistik, kontak/sosial footer) tetap menunggu aset
asli panitia; `public/images/ivan-1.jpg` terhapus di working tree dan belum diputuskan.
Diuji: `tsc`, `eslint`, 90 uji vitest; browser (dev server, desktop/ponsel/mode gelap).

---

## 6 Oktober 2026 — Penyegaran UI hangat dan minimalis

- (Superseded oleh "Warm Editorial": kini tidak miring.) Catatan kecil "NB: Pembayaran online · Konfirmasi otomatis" tampil langsung
  di bawah CTA kartu kategori yang tersedia. Caption serupa juga ada dekat pengantar
  formulir `/daftar`, tanpa menambah panel atau tombol.
- Galeri "Momen SMADARUN Sebelumnya" kini memakai lima foto asli panitia (`hero3.JPG`
  sampai `hero7.JPG`). Foto panggung membuka galeri, tiga foto di tengah disusun
  dalam satu baris dengan lebar kolom mengikuti rasio masing-masing agar tingginya
  sejajar, lalu foto garis start menutupnya selebar area konten. Tata letak
  mengikuti rasio asli setiap foto tanpa crop; klik membuka lightbox dengan navigasi
  dan zoom.
- Foto hero kini selebar viewport tanpa batas samping dan tanpa sudut kartu. Jarak di atas
  serta di bawah foto tetap; teks berada di dalam lebar konten agar beranda tetap tenang.
- Foto hero kini memakai `public/images/hero1.JPG`, dokumentasi start asli yang diberikan
  panitia. Crop responsif menampilkan pelari dan menyembunyikan teks 2026 serta tanggal
  yang sudah tertanam di tepi foto.
- Beranda memakai hero editorial: judul event selebar halaman, foto start sebagai satu
  bidang visual, dan satu CTA ringkas. Panel jadwal serta ajakan akhir memakai aksen
  lingkaran tipis sebagai sentuhan futuristis.
- Setelah tinjauan pemilik, skala judul hero dilunakkan dan garis rambut lurus
  ditempatkan di bawah judul. Aksen garis mengikuti scroll bila browser
  mendukung, tetap terlihat statis bila tidak, dan berhenti bergerak pada reduced motion.
  Foto resmi di garis start kemudian diberikan panitia dan kini dipakai di hero.
- Token warna terang dan gelap bergeser ke krem, amber, dan cokelat lembut; kartu fasilitas
  dan tiket disederhanakan. Teks promosi dipadatkan tanpa mengubah data live, placeholder,
  atau kontrak pendaftaran.
- Portal `/daftar` memakai kepala halaman yang lebih tenang, grid halus, tipografi dan
  input lebih ringan, pemisah tahap yang jelas, serta tombol bayar berukuran ringkas.
- Header tetap satu bar penuh: latar kaca hangat menguat saat digulir, tautan mendapat
  garis hover halus, dan garis progres setipis satu piksel mengikuti scroll di browser
  yang mendukung. Reveal tiap seksi dibuat pendek dan lembut; reduced motion mematikannya.
  Testimoni dan FAQ memakai ritme tipografi yang lebih tenang.
- Preview dan build memakai mock core lokal. Tidak ada perubahan pada core.

---

## 5 Oktober 2026 — Kolom form tambahan otomatis dari core

Prasyarat: kembarin-v2 dengan `semantic` di `form_schema` publik (branch
`feat/form-schema-partner`). Sebelum core itu tayang, daftar kolom tambahan kosong — situs
berperilaku persis seperti sebelumnya.

- Keputusan pemilik: kolom yang panitia tambahkan di form builder kembar.in harus muncul di
  sini tanpa coding. Semua field `semantic: null` dirender generik per peserta (setelah
  Kategori), lengkap dengan wajib/opsional, pilihan, batas panjang, dan validasi tipe.
- Batas body `api/daftar` 32 KB → 64 KB untuk memberi ruang isian tambahan (core menerima 3 MB).
- Mock core memasang contoh kontak darurat & golongan darah; `GET /__tambahan?on=0` melepasnya.

Diuji: 90 uji vitest; browser (build production + mock core): kolom tampil dengan label core,
kolom wajib kosong diberi pesan dan dihitung di ringkasan, opsional tidak, payload membawa
`kontak_darurat_nama/nomor` dan `golongan_darah` dengan nomor dirapikan.

---

## 5 Oktober 2026 — Kolom Nama BIB dari form_schema core

Prasyarat: kembarin-v2 `v2` commit `2c2f418` (endpoint event publik mengirim `form_schema`;
dicek production menjawab key `form_schema`).

- Kolom "Name On BIB" per peserta tampil hanya bila panitia memasang field bertipe
  `name_on_bib` di form builder kembarin-v2; label dan batas (`maxLength`, 15) ikut dari core.
- Opsional (kosong = BIB pakai nama lengkap), huruf besar otomatis, emoji/huruf hias ditolak,
  tidak bisa diubah peserta setelah daftar (koreksi lewat panitia) — keputusan pemilik.
- `api/daftar` memvalidasi ulang dan mengirimnya di `customFields[<nama field core>]`.
- Mock core memasang kolom ini secara bawaan; `GET /__namabib?on=0` melepasnya.

Diuji: 84 uji vitest; browser (build production + mock core): kolom tampil, huruf besar,
emoji ditolak, payload membawa `nama_bib`, kolom hilang saat field dilepas.

---

## 2 Oktober 2026 — Penyelarasan ke kontrak partner core

Branch `claude/kontrak-partner-smadarun`, di-merge ke `main`. Prasyarat: kontrak partner core
sudah rilis (kembarin-v2 `v2` commit `e1e8c23`; dicek: `POST /api/public/orders/status`
production menjawab `404 ORDER_NOT_FOUND` untuk kode palsu, jadi `ORDER_STATUS_TOKEN_SECRET`
terpasang).

- **Kode error baru core** ditafsirkan: `REGISTRATION_ORDER_PROCESSING` (belum pasti + kode
  pesanan), `REGISTRATION_IDENTITY_PENDING_ORDER` (ditolak + kode pesanan),
  `REGISTRATION_IDEMPOTENCY_MISMATCH` / `REGISTRATION_SESSION_INVALID` (ditolak, `partner_bug`,
  browser membuang `sessionId`), `PAYMENT_GATEWAY_RECONCILIATION_REQUIRED` memakai field
  `orderCode`. Pesan core untuk MISMATCH tidak diteruskan karena menyuruh muat ulang halaman
  (isian hilang); di sini cukup tekan Bayar lagi.
- **`statusToken`** masuk allowlist respons sukses.
- **Halaman `/daftar/status` memeriksa status sungguhan** lewat route baru `api/status-pesanan`;
  token disimpan di `sessionStorage` tab pendaftar.
- **`consent_policy_version`** dikirim (`src/lib/persetujuan.ts`, label awal `smadarun-2026-10`).
- **Batas ke core 10 → 20 permintaan/menit per IP** — keputusan pemilik (core mengizinkan 30).
- Aturan proxy bersama dipindah ke `src/lib/proxyCore.ts`.
- Dokumentasi agent: `docs/`, `AGENTS.md`, `scripts/mock-core.mjs`.

Diuji: 75 uji vitest; browser (build production + mock core): token tersimpan → status
pending/lunas/kedaluwarsa, fitur belum aktif & tab tanpa token → tautan kembar.in, kode
proses/identitas/beda, rotasi `sessionId` setelah MISMATCH, token tidak masuk log.

Terbuka:
- Migrasi core `migrate-add-order-partner-contract.mjs` (kolom `consent_json`,
  `request_fingerprint`) — status eksekusinya di production belum diverifikasi dari sisi ini.
  Sebelum migrasi, persetujuan & pemeriksaan isi berbeda belum aktif di core.
- Token hanya ada di tab tempat mendaftar; tab/perangkat lain hanya mendapat panduan umum.

---

## 2 Oktober 2026 — Perbaikan hasil audit (commit `0669413`, `c5aeeab`)

Audit: laporan Codex "Audit Smadarun 2027 — UI, UX, keamanan" (nilai 6,1/10). Semua temuan
diverifikasi di kode sebelum diperbaiki.

- **P1 integritas peserta:** pemesan dikaitkan lewat key, bukan indeks 0. Bug: hapus Peserta 1
  membuat peserta berikutnya memakai nama/email/WA pemesan dengan NIK miliknya sendiri.
- **P2 kepastian transaksi:** `sessionId` (idempotensi core), tiga hasil (berhasil / ditolak /
  belum pasti), timeout 25 dtk mencakup body, timeout browser, tanpa retry otomatis, kunci per
  NIK selama request berjalan, tautan cadangan pengalihan, error boundary & halaman status
  tidak lagi mengklaim hasil.
- **P3 dependency:** Next 16.3.1 → 16.3.8 (+ paket Next terkait), sharp 0.35.5, dev transitif
  via `npm audit fix` biasa. `npm audit` 0. Ditambah vitest 4 (dev).
- **P4 API & privasi:** root JSON wajib objek, 415/413/403, email ≤ 254, log terstruktur tanpa
  body, batas laju dua lapis.
- **P5 UX & a11y:** "Sudah bayar?" di ponsel, Kebijakan Privasi dari kotak persetujuan, galeri
  `<button>`, combobox ARIA + fokus, h1/h2 + skip link, token `--field-border` & `--focus`.

Belum dikerjakan dari audit (di luar cakupan saat itu): konten placeholder (kontak, statistik,
testimoni, galeri — sengaja sampai menjelang peluncuran), kelengkapan info acara (tanggal, COT,
rute), membedakan "gangguan" dari "pendaftaran ditutup", metadata OG/canonical per halaman,
regex nama yang lebih inklusif, CSP `unsafe-inline`, ukuran gambar lightbox, pencocokan gun start
berbasis substring.

---

## 2 Oktober 2026 — Tata letak ponsel (commit `c5120f9`, `b25c6a6`)

- Kota Domisili satu baris penuh; daftar wilayah turun baris; pencarian 16px (Safari iOS zoom
  otomatis di bawah 16px); panel dropdown digeser ke bawah header di layar sentuh, tinggi
  daftar mengikuti `visualViewport`, bar "Bayar" disembunyikan selama dropdown terbuka.
- Kartu form meluber 7px di ponsel: grid tanpa kolom eksplisit + `<fieldset>` `min-inline-size`.
  Perbaikan: `grid-cols-1`, `min-w-0`, dan `overflow-x-clip` dipindah dari `body` ke `<main>`
  (Safari iOS mengabaikan clip di body). Aturannya kini di `CLAUDE.md`.
