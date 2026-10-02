# Catatan perubahan & keputusan

Urut terbaru di atas. Tiap entri: apa, kenapa, keputusan pemilik, dan yang masih terbuka.
Detail teknis ada di pesan commit (`git show <hash>`) dan di `INTEGRASI_CORE.md`.

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
