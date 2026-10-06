# Catatan perubahan & keputusan

Urut terbaru di atas. Tiap entri: apa, kenapa, keputusan pemilik, dan yang masih terbuka.
Detail teknis ada di pesan commit (`git show <hash>`) dan di `INTEGRASI_CORE.md`.

---

## 6 Oktober 2026 — Penyegaran UI hangat dan minimalis

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
