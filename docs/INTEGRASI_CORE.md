# Integrasi dengan core kembarin-v2 (sisi smadarun2027)

**Terakhir diselaraskan:** 2 Oktober 2026, dengan kontrak partner core (kembarin-v2 branch `v2`,
commit `e1e8c23`, dokumen `docs/PARTNER_INTEGRATION.md`). Dokumen core itulah acuan kanonis;
berkas ini menjelaskan bagaimana situs ini memenuhinya dan di mana kodenya.

## 1. Endpoint core yang dipakai

| Endpoint core | Dipanggil dari | Kapan |
|---|---|---|
| `GET /api/public/events/smadarun` | `src/lib/kembarinEvents.ts` (server) | Render halaman & validasi `api/daftar`. Revalidate 30 dtk, timeout 8 dtk, gagal = dianggap tertutup. |
| `POST /api/participants/register` | `src/app/api/daftar/route.ts` (server) | Pendaftar menekan Bayar. |
| `POST /api/public/orders/status` | `src/app/api/status-pesanan/route.ts` (server) | Halaman `/daftar/status` dibuka di tab yang punya token pesanan. |

Browser tidak pernah memanggil core langsung. Semua lewat route server situs ini, yang
mengirim header trusted-proxy (`X-Trusted-Proxy-Key` + `X-Forwarded-Client-Ip`, lihat
`headerKeCore` di `src/lib/proxyCore.ts`). URL: `KEMBAR_IN_API_URL` (pendaftaran);
endpoint status = origin yang sama + `/api/public/orders/status`.

## 2. Payload pendaftaran

Dibangun EKSPLISIT di `api/daftar` dari field yang sudah divalidasi (jangan pernah `...body`):
`eventCode: "smadarun"`, `sessionId`, `buyer`, `participants[]` (`nama`, `email`,
`ticketTypeId`, `customFields` termasuk `__wilayah_prov`/`__wilayah_kota`),
`paymentGateway: "auto"`, `health_declaration`, `privacy_consent`, `consent_recorded_at`
(jam server situs ini), `consent_policy_version`.

Harga/subtotal dari browser hanya dicocokkan sebagai deteksi manipulasi; core menghitung ulang.

**Kolom tambahan form builder** (sejak 5 Oktober 2026, kontrak core §4a): setiap field
`form_schema` ber-`semantic: null` dirender generik per peserta (`src/lib/kolomTambahan.ts`:
teks, angka, pilihan, tanggal lahir, nomor telepon, email; tipe asing jadi teks) dan dikirim di
`customFields[field.name]`. Kunci yang tidak ada di `form_schema` dibuang `api/daftar`; data inti
(NIK, WhatsApp, domisili, dst.) selalu menang bila namanya bentrok. Core lama tanpa `semantic` =
tidak ada kolom tambahan (tidak menebak).

**Nama BIB** (sejak 5 Oktober 2026) dibaca dari `form_schema` di endpoint event publik core:
field bertipe `name_on_bib` beserta `maxLength`-nya (`src/lib/namaBib.ts`). Ada field itu =
kolom tampil per peserta (opsional) dan nilainya dikirim di `customFields[<nama field core>]`
dalam huruf besar; tidak ada = kolom tidak tampil dan isian browser diabaikan. Core menegakkan
aturan yang sama (maks 15, A–Z/angka/spasi/`. ' -`) dan menolak dengan
`REGISTRATION_VALIDATION_FAILED`. Kosong = BIB dicetak dengan nama lengkap.

## 3. `sessionId` — kunci idempotensi

- UUID v4 dibuat browser, diikat ke **sidik jari isi pesanan** (`pilihSesiPengiriman` di
  `src/lib/pesananPeserta.ts`): isi sama → id sama; isi berubah → id baru.
- Kirim ulang setelah hasil "belum pasti" dengan isi sama → core mengembalikan pesanan yang
  sama (tidak ada pesanan ganda).
- Core menolak id yang dipakai isi berbeda (`REGISTRATION_IDEMPOTENCY_MISMATCH`) atau id tidak
  sah (`REGISTRATION_SESSION_INVALID`). Keduanya = bug di situs ini: dicatat `partner_bug`,
  browser membuang sesi (respons `ulangSesi: true`), kiriman berikut memakai id baru.
- `api/daftar` hanya menerima UUID (lebih ketat dari pola core `^[A-Za-z0-9_-]{8,128}$`);
  tanpa `sessionId` (tab sangat lama) tetap diproses tanpa perlindungan pesanan ganda.

## 4. Tafsir respons — hanya tiga hasil

Kode: `klasifikasiPenolakanCore` dan `verifikasiSuksesCore` (`src/lib/kontrakPendaftaran.ts`).

**Berhasil** hanya bila `success: true` + `orderCode` sah + (`status: "paid"`, atau `"pending"`
+ `paymentUrl` https di domain gateway resmi). Yang diteruskan ke browser hanya `kode`,
`status`, `paymentUrl`, `paymentExpiresAt`, `ticketCount`, `statusToken` (bila polanya sah).

| Dari core | Hasil di situs ini | Yang dilihat pendaftar |
|---|---|---|
| Sukses lengkap | berhasil | Dialihkan ke pembayaran (tautan cadangan setelah 8 dtk) / modal lunas |
| 2xx tidak sesuai kontrak, pending tanpa tautan, tautan domain asing | belum pasti | Modal "Hasil Belum Dapat Dipastikan" + kode pesanan bila ada |
| `REGISTRATION_VALIDATION_FAILED` (400/409) | ditolak | Pesan core |
| `REGISTRATION_IDENTITY_PENDING_ORDER` (409) | ditolak + `orderCode` | Pesan core + kode pesanan + tautan ke halaman status |
| `REGISTRATION_IDEMPOTENCY_MISMATCH` (409) | ditolak, `ulangSesi` | Pesan situs ini (pesan core menyuruh muat ulang = isian hilang) |
| `REGISTRATION_SESSION_INVALID` (400) | ditolak, `ulangSesi` | "Sesi pendaftaran perlu diperbarui…" |
| `REGISTRATION_ORDER_PROCESSING` (503 + Retry-After) | belum pasti + `orderCode` | "Tautan pembayaran masih disiapkan, tunggu N detik, tekan Bayar lagi tanpa mengubah isian" |
| `PAYMENT_GATEWAY_CREATION_FAILED` (400) | ditolak | "Belum ada tagihan maupun pembayaran" |
| `PAYMENT_GATEWAY_RECONCILIATION_REQUIRED` (400) | belum pasti + `orderCode` | Hubungi panitia dengan kode itu |
| `REGISTRATION_RATE_LIMITED` (429), `REGISTRATION_PROTECTION_UNAVAILABLE` (503) | ditolak | Coba lagi nanti |
| 5xx lain, timeout (25 dtk termasuk body), sambungan putus | belum pasti | Modal "Hasil Belum Dapat Dipastikan" |

Aturan copy: hasil "belum pasti" TIDAK BOLEH disebut gagal, dibatalkan, belum tersimpan, atau
berhasil. Isian hanya dikosongkan setelah status `paid`. Tidak ada retry otomatis POST.

**Menambah kode baru dari core:** tambahkan `case` di `klasifikasiPenolakanCore`, tentukan
hasilnya dari kolom "Tindakan partner" di §7 dokumen core, tambahkan uji di
`tests/kontrakPendaftaran.test.ts`, dan perbarui tabel ini.

## 5. Halaman status pesanan

- Setelah pendaftaran, browser menyimpan `{ kode, statusToken }` di `sessionStorage`
  (`smadarun:pesanan-terakhir`, `src/lib/statusPesanan.ts`). Bukan localStorage, bukan URL —
  token adalah kunci akses pesanan. Kode tanpa token (hasil belum pasti/ditolak berkode) juga
  disimpan, tanpa menghapus token milik kode yang sama.
- `/daftar/status` (`PemeriksaStatus.tsx`) memanggil `api/status-pesanan` sekali saat dibuka;
  "Periksa lagi" hanya untuk gangguan/batas laju dan ditekan pengguna.
- Core: `200` → `pending` (tombol bayar + batas WIB), `paid`, `expired`, `cancelled`;
  `404 ORDER_NOT_FOUND` = tidak ada **atau** token salah (dijawab sama, anti-enumerasi);
  `503 ORDER_STATUS_UNAVAILABLE` = `ORDER_STATUS_TOKEN_SECRET` core belum dipasang.
- Tanpa token atau fitur belum aktif: tautan
  `https://kembar.in/events/smadarun/payment-return?order=<kode>`.
- `api/status-pesanan`: timeout 10 dtk termasuk body, tanpa retry, 30 permintaan/menit per IP,
  hanya field allowlist yang diteruskan, token tidak pernah dicatat.

## 6. Jejak persetujuan

Core menyimpan `privacy_consent`, `health_declaration`, `consent_recorded_at`, dan
`consent_policy_version` di `registration_orders.consent_json` (setelah migrasi core
`scripts/migrate-add-order-partner-contract.mjs` dijalankan — sebelum itu diabaikan tanpa error).

Label versi: `src/lib/persetujuan.ts`. **Naikkan setiap teks persetujuan berubah** (kalimat dua
kotak centang di `DaftarForm` atau `IsiKebijakanPrivasi.tsx`): ganti `VERSI_PERSETUJUAN`,
TAMBAHKAN ke `VERSI_PERSETUJUAN_DIKENAL`, jangan hapus label lama. `api/daftar` menolak label
yang tidak dikenal; uji di `tests/apiDaftar.test.ts` memastikan label aktif selalu dikenal.

## 7. Batas laju & batas waktu

| Lapisan | Batas |
|---|---|
| `api/daftar`, semua permintaan per IP | 30/menit (saringan banjir) |
| `api/daftar`, diteruskan ke core per IP | 20/menit (keputusan pemilik; core: 30/menit per IP pengunjung partner, 600/menit per partner) |
| `api/status-pesanan` per IP | 30/menit (core: 20/menit per pesanan, 60/menit per IP) |
| Timeout ke core | 25 dtk pendaftaran, 10 dtk status — termasuk pembacaan body |
| Timeout browser | 45 dtk pendaftaran, 15 dtk status |

Batas di situs ini per instance serverless (Map di memori); batas terpusat ada di core.

## 8. Env & urutan rilis

| Env (Vercel, server-only) | Keterangan |
|---|---|
| `KEMBAR_IN_API_URL` | URL pendaftaran core (fallback production). Endpoint status diturunkan dari origin-nya. |
| `KEMBAR_IN_PUBLIC_EVENT_BASE_URL` | Base URL data live event. |
| `TRUSTED_PROXY_API_KEY` | Secret partner; harus sama dengan `TRUSTED_PARTNER_KEYS` (`smadarun:<nilai>`) atau `TRUSTED_PROXY_API_KEY` di core. Tanpa ini core menghitung semua pendaftar sebagai IP server situs ini. |

Tidak ada env baru untuk halaman status. Urutan rilis selalu **core lebih dulu**: perubahan
kontrak core bersifat tambahan, jadi situs versi lama tetap berjalan.
