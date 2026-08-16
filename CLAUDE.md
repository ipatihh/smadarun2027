# CLAUDE.md — smadarun2027

Landing page mandiri untuk event SMADARUN 2027. Baca `README.md` dulu untuk gambaran umum.
File ini berisi hal-hal yang tidak terlihat jelas dari sekadar membaca kode.

## Fakta arsitektur yang wajib dipahami sebelum mengubah apa pun

- **kembarin-v2 adalah sumber kebenaran mutlak**, project ini bukan. Harga, kategori tiket,
  dan status buka/tutup pendaftaran SELALU di-fetch live dari kembarin-v2
  (`src/lib/kembarinEvents.ts`), tidak pernah di-hardcode. `src/data/tiket.ts` HANYA boleh
  berisi metadata marketing (nama tampilan, daftar fasilitas) — jangan pernah tambahkan field
  harga/isAvailable ke situ lagi, itu sudah pernah jadi sumber bug (lihat commit `1b80757`
  dan `3a337ae`).
- Server (`api/daftar/route.ts`) juga fetch live data sendiri untuk validasi ulang harga —
  JANGAN percaya nominal/subtotal/total yang dikirim client, walau kembarin-v2 sendiri juga
  sudah zero-trust terhadap ini (defense-in-depth, bukan redundan sia-sia).
- `event_code` yang dipakai adalah **`"smadarun"`**, BUKAN `"smadarun2027"` — kembarin-v2
  sudah rename dari `smadarun2027` ke `smadarun` (lihat commit `625705b`). Nama project,
  domain (`smadarun2027.vercel.app`), dan branding UI tetap "SMADARUN 2027" — itu berbeda
  dari event_code teknis. Jangan bingung antara keduanya.
- Endpoint yang dipakai untuk baca data live: `GET /api/public/events/[eventCode]` (lookup
  per-kode, tidak terpengaruh `show_in_gallery`) — BUKAN `GET /api/public/events` (listing
  bulk kembar.in sendiri yang terfilter `show_in_gallery`). Kalau butuh integrasi serupa
  untuk event lain, endpoint per-kode ini yang benar dipakai.
- Kalau fetch ke kembarin-v2 gagal (network error, 5xx, dsb), kode selalu **fail-closed** —
  dianggap "pendaftaran tertutup", bukan pakai data lama/fallback. Ini prinsip yang harus
  dipertahankan di kode terkait pembayaran: lebih baik gagal aman daripada menampilkan
  harga/status yang sudah usang.

## Gotcha operasional

- `.env` di repo ini **tidak ter-track git** (sengaja dikeluarkan, lihat `.gitignore`).
  Jangan pernah taruh secret asli (`TRUSTED_PROXY_API_KEY`, dst) di file yang ter-track git —
  pakai `.env.local` untuk dev, Vercel Dashboard untuk production.
- `TRUSTED_PROXY_API_KEY` harus **sama persis** dengan env var bernama sama di project
  kembarin-v2 (dua project, satu secret). Kalau ganti nilainya, harus diganti di kedua tempat
  bersamaan atau fitur trusted-proxy diam-diam nonaktif (fail-safe ke perilaku lama, tidak
  error — jadi kalau lupa sinkron, tidak akan langsung ketahuan dari behavior).
- Next.js 16 + Turbopack + React 19 + ESLint 9 flat config (`next lint` sudah dihapus di v16,
  pakai `eslint .`).

## Kalau perlu ubah sesuatu di sisi kembarin-v2

Project ini dan kembarin-v2 (`/Users/ivatih/Coding/kembarin-v2`) biasanya dikerjakan di sesi
Claude Code terpisah. Kalau ada perubahan yang perlu dilakukan di kembarin-v2 (endpoint baru,
fix bug di core, dsb), siapkan prompt self-contained untuk sesi itu daripada langsung
mengedit filenya dari sesi ini — kecuali user secara eksplisit minta dikerjakan langsung.
Dokumentasi kanonis kembarin-v2 ada di `kembarin-v2/docs/README.md` (index-nya sendiri) —
baca itu dulu kalau butuh konteks arsitektur core system.
