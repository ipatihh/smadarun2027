# Pengujian smadarun2027

Prinsip: **tidak ada payload pendaftaran valid yang boleh sampai ke core production**, dan tidak
ada pembayaran sungguhan. Semua uji transaksi memakai data sintetis + mock core.

## 1. Uji regresi (wajib, tanpa jaringan)

```bash
npm test          # vitest run — tests/*.test.ts
npm run lint
npx tsc --noEmit
npm run build
```

| Berkas | Yang dijaga |
|---|---|
| `tests/pesananPeserta.test.ts` | Kaitan pemesan lewat key (regresi bug hapus Peserta 1), 300 urutan tambah/hapus/centang acak dengan model independen, rotasi `sessionId` per sidik jari isi. |
| `tests/kontrakPendaftaran.test.ts` | Allowlist respons sukses core, `statusToken`, klasifikasi semua kode error core (ditolak vs belum pasti), tafsir respons di browser. |
| `tests/apiDaftar.test.ts` | Route `api/daftar` dengan data live & core di-mock: bentuk body, Content-Type, Origin, batas ukuran, timeout termasuk body macet, kunci per NIK, batas laju, `consent_policy_version`, kode baru, tidak ada PII di log. |
| `tests/kolomTambahan.test.ts` | Kolom generik dari `form_schema` core: hanya `semantic: null`, core lama tanpa penanda = kosong, validasi per tipe. |
| `tests/namaBib.test.ts` | Pembacaan kolom Nama BIB dari `form_schema` core, cadangan `maxLength`, rapikan & validasi. |
| `tests/statusPesanan.test.ts` | Allowlist & pemetaan status core, penyimpanan `localStorage` (maks 5, 30 hari, pindahan kunci sesi lama), route `api/status-pesanan` (validasi, timeout 10 dtk, batas laju, token tidak masuk log). |

Saat memperbaiki bug, tulis uji yang GAGAL pada kode lama lebih dulu. Cara cepat memastikan uji
tidak lolos semu: masukkan kembali perilaku lama sementara (uji mutasi), pastikan uji gagal,
lalu pulihkan.

## 2. Uji di browser dengan mock core

Untuk perubahan yang terlihat di browser (form, modal, halaman status). Gunakan **build
production** di port terpisah, bukan dev server yang mungkin sedang dipakai.

1. Jalankan mock: `node scripts/mock-core.mjs` (port 4010). Mode & endpoint kendali ada di
   kepala berkas itu.
2. Build dengan env diarahkan ke mock (nilai env proses selalu menang atas `.env`, termasuk
   string kosong — `@next/env` tidak menimpa variabel yang sudah ada):
   ```bash
   KEMBAR_IN_API_URL=http://127.0.0.1:4010/api/participants/register \
   KEMBAR_IN_PUBLIC_EVENT_BASE_URL=http://127.0.0.1:4010/api/public/events \
   TRUSTED_PROXY_API_KEY= npm run build
   ```
3. Jalankan `next start -p 3100` dengan env yang sama. Untuk tool preview Claude, tambahkan
   konfigurasi **sementara** di `.claude/launch.json` (`runtimeExecutable: "env"`, argumen env di
   atas lalu `npx next start -p 3100`), dan kembalikan berkas itu setelah selesai — berkas ini
   dilacak git.
4. **Probe keamanan sebelum uji apa pun:** set `GET /__mode?m=tolak`, kirim satu POST
   `api/daftar` dengan kategori `UJI LOKAL 5K`, lalu pastikan `GET /__log` di mock mencatatnya.
   Kalau tidak tercatat, berhenti — permintaan pergi ke tempat lain.
5. Setelah selesai: hentikan server & mock, kembalikan `.claude/launch.json`, dan build ulang
   dengan env normal supaya `.next` lokal tidak berisi data mock.

Kategori mock sengaja tidak ada di production (lihat komentar di `scripts/mock-core.mjs`).
Jangan mengganti nama kategorinya ke kategori asli.

### Mencegat pengalihan ke gateway

Supaya browser uji tidak benar-benar membuka halaman pembayaran (meski sandbox), cegat lewat
Navigation API sebelum mengirim form:

```js
window.__tujuan = [];
navigation.addEventListener("navigate", (e) => {
  if (!e.destination.url.startsWith(location.origin)) { window.__tujuan.push(e.destination.url); e.preventDefault(); }
});
```

### Mengisi input React dari skrip

Setter nilai native + event `input`/`change`. Ubah nilainya dulu ke nilai lain, karena pelacak
nilai React mengabaikan nilai yang sama dengan yang terakhir ia lihat (terjadi bila input
sempat diisi sebelum hidrasi).

## 3. Jebakan lingkungan uji (pernah terjadi)

- **Panel browser tersembunyi** (`document.visibilityState === "hidden"`): tata letak bisa belum
  dihitung (semua ukuran 0) dan hidrasi React tertunda menunggu frame. Majukan tab
  (`tabs_select`) dan ambil satu screenshot untuk memaksa frame, lalu tunggu sampai elemen punya
  properti `__react*` sebelum berinteraksi. Timer juga diperlambat; pecah tunggu panjang
  menjadi beberapa panggilan (batas satu panggilan skrip 45 dtk).
- **macOS tidak punya perintah `timeout`.** Pakai batas waktu milik alatnya (mis.
  `vitest --testTimeout`).
- **zsh tidak memecah variabel tanpa kutip** (`$H` berisi `-H origin:...` terkirim sebagai satu
  argumen). Tulis opsi langsung atau pakai fungsi shell.
- **Preview Vercel dilindungi Vercel Authentication.** Pakai `vercel curl <path> --deployment
  <url> -- <opsi curl>` (CLI v52). Panggilan pertama bisa masih kena halaman proteksi; ulangi.
  Di preview hanya kirim permintaan yang pasti ditolak sebelum core (mis. `eventCode` salah) —
  env preview bisa mengarah ke core production.
- **Halaman `/daftar` ISR 30 dtk**: data live baru muncul setelah revalidasi; muat ulang bila
  masih melihat data lama.

## 4. Verifikasi setelah deploy production

Hanya permintaan yang ditolak sebelum mencapai core:

```bash
D=https://www.smadarun.id
curl -s -X POST $D/api/daftar -H 'content-type: application/json' -H "origin: $D" --data '{"eventCode":"salah"}'   # 400 = Origin lolos
curl -s -o /dev/null -w '%{http_code}\n' -X POST $D/api/daftar -H 'content-type: application/json' -H 'origin: https://situs-lain.example' --data '{}'   # 403
curl -s -o /dev/null -w '%{http_code}\n' -X POST $D/api/status-pesanan -H 'content-type: application/json' -H "origin: $D" --data '{}'   # 400
```

Lalu periksa halaman memuat kode baru (`curl -s $D/daftar | grep ...`) dan pantau log Vercel
untuk event `partner_bug`, `core_timeout`, `core_malformed_success`, `core_missing_payment_url`.
