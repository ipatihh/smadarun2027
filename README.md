# SMADARUN 2027 — Landing Page & Portal Pendaftaran

Landing page resmi event lari SMADARUN 2027 (persembahan SMA Negeri 2 Nganjuk). Next.js App
Router (v16) + Tailwind CSS, di-deploy mandiri di Vercel (`smadarun2027.vercel.app`), **tapi
seluruh data event/tiket dan proses registrasi/pembayaran ditangani oleh core system
[kembarin-v2](https://kembar.in)** — project ini murni frontend + proxy tipis ke sana.

Project ini adalah contoh/referensi pertama dari pola **"Partner Site Integration"**
kembarin-v2: sebuah landing page mandiri (domain sendiri, deploy sendiri, boleh dikelola tim
berbeda) yang tetap memakai kembarin-v2 sebagai satu-satunya sumber kebenaran untuk harga,
kategori tiket, status buka/tutup pendaftaran, dan pemrosesan pembayaran (DOKU).

## Arsitektur Singkat

```
Browser pengunjung
     │
     ▼
smadarun2027 (Next.js, project ini)
     │
     ├─ GET  /api/public/events/smadarun    → baca harga/kategori/status LIVE
     │        (kembar.in, tanpa auth, dipanggil server-side, revalidate 30 detik)
     │
     └─ POST /api/daftar → proxy internal Next.js
              │
              ▼
        POST https://kembar.in/api/participants/register  (server-to-server)
              │
              ▼
        kembarin-v2 (core system): validasi ulang harga & kategori dari database-nya
        sendiri (zero-trust — tidak pernah percaya nominal/kategori dari client manapun),
        buat order, buat transaksi DOKU, kembalikan paymentUrl.
```

**Prinsip penting:** kembarin-v2 adalah sumber kebenaran mutlak untuk harga, kategori, dan
status buka/tutup — bukan project ini. Lihat `src/lib/kembarinEvents.ts`. Mengubah pengaturan
di dasbor Super Admin kembarin-v2 (tab **Events** untuk status/harga/kategori) otomatis
berlaku di sini dalam ≤30 detik, tanpa perlu redeploy project ini.

## Struktur Kode yang Relevan

| Path | Fungsi |
|---|---|
| `src/lib/kembarinEvents.ts` | Satu-satunya titik fetch data live (harga, kategori, status) dari kembarin-v2. |
| `src/app/daftar/page.tsx` | Server Component — fetch data live, render `DaftarForm`. |
| `src/app/daftar/DaftarForm.tsx` | Client Component — form interaktif, terima data live lewat props. |
| `src/app/api/daftar/route.ts` | Proxy internal: validasi ketat input, validasi ulang harga/kategori dari data live, teruskan ke kembarin-v2. |
| `src/data/tiket.ts` | **Hanya** metadata marketing (nama tampilan, daftar fasilitas) — bukan harga/ketersediaan. |
| `src/components/Tiket/Tiket.tsx` | Server Component homepage — gabungkan data live + metadata marketing. |

## Menjalankan Secara Lokal

```bash
npm install
cp .env.example .env.local   # isi nilai sesuai kebutuhan, lihat tabel di bawah
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Environment Variables

Lihat `.env.example` untuk template lengkap. Ringkasan:

| Variable | Wajib? | Keterangan |
|---|---|---|
| `KEMBAR_IN_API_URL` | Tidak (ada fallback ke production) | Endpoint registrasi kembarin-v2 yang dipanggil `/api/daftar`. |
| `KEMBAR_IN_PUBLIC_EVENT_BASE_URL` | Tidak (ada fallback ke production) | Base URL endpoint publik lookup event per-kode. Kode ini menambahkan `/smadarun` sendiri. |
| `TRUSTED_PROXY_API_KEY` | Tidak (opt-in) | Shared secret dengan kembarin-v2 agar rate limiter di sana bisa membedakan pengunjung asli (bukan menganggap semua pengunjung sebagai satu IP egress server). **Nilai asli JANGAN pernah masuk file `.env` yang ter-track git** — pakai `.env.local` (gitignored) untuk dev, dan Vercel Dashboard Environment Variables untuk production. |
| `GOOGLE_ANALYTICS_ID` | Tidak | GA4 measurement ID, kosongkan untuk nonaktifkan analytics. |

`.env` di repo ini **tidak ter-track git** (lihat `.gitignore`) — riwayat commit lama sudah
diaudit bersih, tidak ada secret asli yang pernah bocor.

## Keamanan

- Semua input divalidasi ketat di server (`api/daftar/route.ts`) — regex whitelist untuk nama, NIK, WhatsApp, kota, dsb.
- Harga & kategori tiket divalidasi ulang di server terhadap data live kembarin-v2 sebelum diteruskan — mencegah manipulasi nominal dari client, walau kembarin-v2 sendiri juga sudah zero-trust terhadap ini.
- Redirect otomatis ke halaman pembayaran DOKU divalidasi domainnya (`*.doku.com` via HTTPS saja) sebelum browser diarahkan — mencegah open-redirect kalau respons backend tidak sesuai ekspektasi.
- Security headers (CSP, HSTS, X-Frame-Options, dst) diatur di `next.config.mjs`.
- Rate limiting & proteksi double-submit di sisi server (`api/daftar/route.ts`), plus header trusted-proxy opsional supaya rate limiter kembarin-v2 tidak salah tembak pengunjung berbeda sebagai satu sumber (lihat env var di atas).

## Deployment

Auto-deploy ke Vercel dari branch `main`. Tidak ada langkah manual tambahan selain
memastikan Environment Variables (tabel di atas) sudah diisi di Vercel Dashboard kalau
tidak memakai nilai fallback default.

## Project Terkait

- **[kembarin-v2](https://kembar.in)** — core system: database peserta, event, tiket, pembayaran DOKU, dasbor Super Admin. Semua pengaturan harga/kategori/status buka-tutup event SMADARUN 2027 dikelola di sana, bukan di repo ini.
