# Dokumentasi smadarun2027 — mulai di sini

Untuk agent (Claude, Codex, dll.) dan pengembang yang baru masuk ke repo ini. Baca berurutan:

1. **`CLAUDE.md`** (root) — aturan wajib dan jebakan yang tidak terlihat dari kode. Berlaku
   untuk semua agent, bukan hanya Claude.
2. **[`INTEGRASI_CORE.md`](INTEGRASI_CORE.md)** — kontrak dengan core kembarin-v2 dari sisi
   situs ini: endpoint, payload, `sessionId`, tafsir tiap kode error, halaman status, jejak
   persetujuan, env, urutan rilis.
3. **[`PENGUJIAN.md`](PENGUJIAN.md)** — cara menguji tanpa menyentuh core production: `npm test`,
   mock core lokal (`scripts/mock-core.mjs`), probe keamanan, jebakan lingkungan uji.
4. **[`CATATAN_PERUBAHAN.md`](CATATAN_PERUBAHAN.md)** — riwayat perubahan penting, alasan,
   keputusan pemilik, dan hal yang masih terbuka.

Acuan kanonis kontrak core ada di repo kembarin-v2: `docs/PARTNER_INTEGRATION.md` (baca saja dari
sesi ini; perubahan core dikerjakan di sesi kembarin-v2 — lihat bagian akhir `CLAUDE.md`).

## Peta modul (alur pendaftaran)

| Path | Peran |
|---|---|
| `src/app/daftar/DaftarForm.tsx` | Formulir kolektif (client). Validasi cermin server, kirim ke `api/daftar`, tampilkan hasil (berhasil / ditolak / belum pasti), simpan pesanan terakhir untuk halaman status. |
| `src/lib/pesananPeserta.ts` | Logika murni pesanan: kaitan pemesan lewat key, tambah/hapus peserta, payload `participants[]`, kunci idempotensi per sidik jari isi. |
| `src/app/api/daftar/route.ts` | Proxy pendaftaran ke core: validasi ketat, hitung ulang harga, payload eksplisit, batas waktu 25 dtk termasuk body, tafsir respons. |
| `src/lib/kontrakPendaftaran.ts` | Kontrak respons pendaftaran: verifikasi sukses (allowlist), klasifikasi kode error core, tafsir respons di browser. |
| `src/lib/proxyCore.ts` | Aturan bersama proxy ke core: IP pengunjung, batas laju, Origin, Content-Type, batas body, header trusted-proxy, URL core, log tanpa PII. |
| `src/app/daftar/status/page.tsx` + `PemeriksaStatus.tsx` | Halaman status: status sungguhan untuk pesanan terakhir tab ini (token di `sessionStorage`), sisanya panduan bersyarat. |
| `src/app/api/status-pesanan/route.ts` + `src/lib/statusPesanan.ts` | Proxy status pesanan ke core + allowlist + penyimpanan `sessionStorage`. |
| `src/lib/persetujuan.ts` | Label versi teks persetujuan (`consent_policy_version`). Naikkan saat teks persetujuan berubah. |
| `src/lib/kembarinEvents.ts` | Satu-satunya pembaca data live event (harga, kategori, status buka/tutup). |
| `src/lib/identitas.ts`, `src/lib/wilayah.ts`, `src/lib/paymentUrl.ts` | Aturan nomor identitas, dataset wilayah, whitelist domain gateway. |
| `tests/*.test.ts` | Uji regresi vitest (tanpa jaringan). |

## Sebelum menyatakan selesai

- `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` hijau.
- Perubahan yang terlihat di browser diuji di build production + mock core (lihat `PENGUJIAN.md`).
- **Jangan pernah** mengirim payload pendaftaran yang valid ke core production. `main` auto-deploy
  ke production (`www.smadarun.id`) — push ke `main` = rilis.
- Catat perubahan penting di `CATATAN_PERUBAHAN.md`, dan aturan baru yang tidak terlihat dari kode
  di `CLAUDE.md`.
