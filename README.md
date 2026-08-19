# SMADARUN 2027 — Landing Page & Portal Pendaftaran

Landing page resmi event lari SMADARUN 2027 (persembahan SMA Negeri 2 Nganjuk). Next.js App
Router (v16) + Tailwind CSS, di-deploy mandiri di Vercel dengan domain `smadarun.id`, **tapi
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
              │  (payload { buyer, participants[] } — 1 sampai N peserta per pesanan)
              ▼
        POST https://kembar.in/api/participants/register  (server-to-server)
              │
              ▼
        kembarin-v2 (core system): validasi ulang harga & kategori dari database-nya
        sendiri (zero-trust — tidak pernah percaya nominal/kategori dari client manapun),
        hitung biaya layanan per tiket, kunci kuota per kategori, buat SATU order untuk
        seluruh peserta, buat transaksi DOKU, kembalikan paymentUrl.
```

**Pembelian kolektif:** satu pemesan dapat mendaftarkan beberapa peserta dalam satu
pembayaran (boleh beda kategori & ukuran jersey). Batasnya mengikuti
`event_config.multi_ticket_enabled` dan `max_tickets_per_order` di kembarin-v2 — tidak
di-hardcode di sini. **Biaya layanan dihitung per tiket**, jadi pesanan 5 tiket ditagih
5 × biaya layanan, sama seperti perhitungan core.

**Prinsip penting:** kembarin-v2 adalah sumber kebenaran mutlak untuk harga, kategori, dan
status buka/tutup — bukan project ini. Lihat `src/lib/kembarinEvents.ts`. Mengubah pengaturan
di dasbor Super Admin kembarin-v2 (tab **Events** untuk status/harga/kategori) otomatis
berlaku di sini dalam ≤30 detik, tanpa perlu redeploy project ini.

## Struktur Kode yang Relevan

| Path | Fungsi |
|---|---|
| `src/lib/kembarinEvents.ts` | Satu-satunya titik fetch data live (harga, kategori, status, jadwal RPC/gun-start, aturan kolektif) dari kembarin-v2. Fetch dibatasi timeout 8 detik — kalau kembar.in menggantung, halaman tetap jatuh ke keadaan "tertutup" dengan cepat, bukan ikut menggantung. |
| `src/app/daftar/page.tsx` | Server Component — fetch data live, render `DaftarForm`. |
| `src/app/daftar/DaftarForm.tsx` | Client Component — form pemesan + daftar peserta (kolektif, bisa tambah/hapus peserta), validasi sisi klien sebagai cermin validasi server (bukan pengganti), redirect ke DOKU. |
| `src/app/daftar/status/page.tsx` | Halaman tujuan balik setelah pembayaran DOKU. Sengaja **informasional saja**, bukan pengecek status asli — kembarin-v2 belum menyediakan endpoint publik untuk itu; mengarang tampilan "berhasil/gagal" tanpa data asli justru menyesatkan. |
| `src/app/api/daftar/route.ts` | Proxy internal: validasi ketat tiap peserta (termasuk persetujuan kesehatan & privasi di server, bukan cuma checkbox), hitung ulang harga & biaya layanan per tiket dari data live, teruskan sebagai pesanan `{ buyer, participants[] }`. Log dan double-submit map dibersihkan dari NIK mentah (di-hash). |
| `src/data/tiket.ts` | **Hanya** metadata marketing (nama tampilan, fasilitas, `badge`, `highlight`) — bukan harga/ketersediaan. |
| `src/components/Tiket/Tiket.tsx` + `TiketGrid.tsx` + `TiketColumn.tsx` | Server Component homepage — gabungkan data live + metadata marketing. `Tiket.tsx` juga memisahkan fasilitas yang sama di semua kategori ke satu baris ringkas di bawah grid, supaya pembeda asli (harga) tidak tenggelam. |
| `src/components/CountdownSection.tsx` + `Countdown.tsx` | Panel hitung mundur ke `live.eventDate`. Client Component kecil (`Countdown.tsx`) yang di-tick tiap detik; fallback teks kalau tanggal belum diisi panitia. |
| `src/components/Timeline.tsx` + `TimelineItems.tsx` | Seksi "Susunan Acara" — RPC (jadwal/lokasi pengambilan race pack) dan gun-start per kategori jarak, semua dari `event_config` live. Otomatis tidak render apa pun kalau datanya kosong. |
| `src/components/FooterLive.tsx` + `Footer.tsx` | `FooterLive` membungkus fetch data live (biaya layanan untuk teks Syarat & Ketentuan) dalam `Suspense` miliknya sendiri — **jangan pindahkan fetch ini ke root layout**, itu pernah membuat SELURUH halaman (bukan cuma footer) ikut menunggu kembar.in sebelum tampil apa pun. |
| `src/data/sponsors.ts` | Daftar sponsor bertingkat (`title` / `community` / `media`) + spesifikasi aset logo. |
| `src/components/Logos.tsx` | Galeri sponsor — seluruh isinya digerakkan `sponsors.ts`, tidak ada logo yang di-hardcode. |
| `src/app/globals.css` + `tailwind.config.ts` | Sistem token warna/radius/bayangan (41 custom property, termasuk pasangan mode gelap). Satu-satunya tempat warna mentah boleh ditulis. |

## Halaman & Bagian Situs

**Beranda (`/`)** — urutan section mengikuti alur pertanyaan pengunjung: `Hero` → `CountdownSection`
(hitung mundur ke hari-H, live dari `event_date`) → `Stats` → `Benefits` → `Tiket` (kartu
kategori, live) → `Timeline` (susunan acara/RPC, live, otomatis tersembunyi kalau datanya
kosong) → `Testimonials` → `FAQ` → `Logos` (sponsor) → `CTA`.

**Form pendaftaran (`/daftar`)** — form kolektif: satu pemesan bisa mendaftarkan beberapa
peserta sekaligus (kalau `multi_ticket_enabled` aktif di kembarin-v2), tiap peserta boleh beda
kategori & ukuran jersey. Ada kartu ringkasan biaya sticky di desktop dan bar aksi melayang di
mobile. Redirect otomatis ke DOKU setelah submit berhasil.

**Status pendaftaran (`/daftar/status`)** — halaman tujuan balik setelah pembayaran, murni
informasional (langkah apa yang terjadi setelah bayar, kontak kalau belum dapat email). Tidak
mengecek status order asli karena kembarin-v2 belum punya endpoint publik untuk itu.

## Sistem UI

- **Semua warna, radius, dan bayangan lewat token** yang didefinisikan di
  `src/app/globals.css` dan dipetakan di `tailwind.config.ts`. Di komponen jangan pakai
  palet Tailwind mentah (`bg-white`, `gray-*`, `amber-*`, dst) — pakai `bg-card`,
  `bg-surface-sunken`, `text-on-primary`, `rounded-card|field|panel`, `shadow-rest|hover`.
- **Mode gelap otomatis** mengikuti setelan sistem pengunjung (tanpa toggle). Setiap warna
  baru wajib punya pasangan di blok `@media (prefers-color-scheme: dark)`.
- **Tanpa library animasi.** Reveal memakai kelas CSS `.reveal` + `.reveal-1..4`, sehingga
  konten tetap terlihat walau JavaScript gagal/lambat, dan otomatis nonaktif lewat
  `prefers-reduced-motion`.
- **Semua modal memakai `Dialog` dari `@headlessui/react`** — sudah termasuk Escape, focus
  trap, dan pengembalian fokus.
- `src/data/**` ikut dipindai Tailwind (lihat `content` di `tailwind.config.ts`) karena file
  data di sana menuliskan kelas (ukuran kotak logo sponsor, warna ikon statistik).
- **Optimasi gambar bawaan Next.js aktif** (`next.config.mjs`, format AVIF/WebP otomatis).
  Semua gambar ada di `/public` (lokal), tidak ada host eksternal yang perlu di-allowlist.

## Menambah Logo Sponsor

1. Taruh file logo di `public/images/sponsors/` (nama huruf kecil tanpa spasi, mis.
   `bank-jatim.png`). Format PNG latar transparan, WebP, atau SVG — tinggi minimal 200px.
2. Tambahkan satu baris di array `sponsors` pada `src/data/sponsors.ts`:

   ```ts
   { name: "Bank Jatim", logo: "bank-jatim.png", tier: "community", url: "https://bankjatim.co.id" },
   ```

   `tier` yang tersedia: `"title"` (Sponsor Utama), `"community"` (Community Partner),
   `"media"` (Media & Partner). `url` boleh dikosongkan.
3. Selesai — ukuran kotak, hierarki, dan pembagian baris menyesuaikan otomatis berapa pun
   jumlah logonya. Belum punya file logonya? Kosongkan `logo`, nama sponsor akan tampil
   sebagai teks di kotak yang sama.

Label dan ukuran tiap tier diatur di `sponsorTiers` pada file yang sama.

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
- Payload ke kembarin-v2 dibangun eksplisit dari field yang sudah divalidasi (tidak ada passthrough field liar dari client), dan persetujuan kesehatan + privasi divalidasi ulang di server lalu dicatat dengan timestamp sisi server.
- Status buka/tutup pendaftaran menghormati `registration_closed`, `registration_open_at`, dan `ticket_types[].is_active` dari kembarin-v2 — bukan hanya status event.
- Harga & kategori tiket divalidasi ulang di server terhadap data live kembarin-v2 sebelum diteruskan — mencegah manipulasi nominal dari client, walau kembarin-v2 sendiri juga sudah zero-trust terhadap ini. Biaya layanan ikut dihitung ulang **per tiket** (`fee × jumlah peserta`).
- Pesanan kolektif divalidasi per peserta: jumlah tiket tidak boleh melebihi `max_tickets_per_order` live, dan satu NIK tidak boleh muncul dua kali dalam satu pesanan (mencegah satu orang memakan kuota kategori berkali-kali). Proteksi double-submit mengunci seluruh NIK dalam pesanan, bukan hanya satu.
- Redirect otomatis ke halaman pembayaran DOKU divalidasi domainnya (`*.doku.com` via HTTPS saja) sebelum browser diarahkan — mencegah open-redirect kalau respons backend tidak sesuai ekspektasi.
- Security headers (CSP, HSTS, X-Frame-Options, dst) diatur di `next.config.mjs`.
- Rate limiting & proteksi double-submit di sisi server (`api/daftar/route.ts`), plus header trusted-proxy opsional supaya rate limiter kembarin-v2 tidak salah tembak pengunjung berbeda sebagai satu sumber (lihat env var di atas). IP pengunjung dibaca dari `x-vercel-forwarded-for` atau entri paling kanan `x-forwarded-for` — bukan seluruh string, yang bisa dikarang klien untuk memecah kunci rate limiter.
- Pesan error dari core hanya diteruskan ke pengguna kalau lolos saringan "pesan untuk manusia"; respons non-JSON tidak dipantulkan, dan log dibersihkan dari deretan angka panjang (NIK/WhatsApp).
- Kunci proteksi double-submit memakai hash NIK ber-salt, bukan NIK mentah.

## Deployment

Auto-deploy ke Vercel dari branch `main`. Tidak ada langkah manual tambahan selain
memastikan Environment Variables (tabel di atas) sudah diisi di Vercel Dashboard kalau
tidak memakai nilai fallback default.

## Project Terkait

- **[kembarin-v2](https://kembar.in)** — core system: database peserta, event, tiket, pembayaran DOKU, dasbor Super Admin. Semua pengaturan harga/kategori/status buka-tutup event SMADARUN 2027 dikelola di sana, bukan di repo ini.
