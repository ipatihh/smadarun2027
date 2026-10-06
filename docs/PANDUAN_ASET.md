# Panduan memasang aset (flyer, logo, favicon, OG image)

Untuk panitia dan agent yang mengisi aset visual. Semua tempat sudah disiapkan; pemasangan hanya
menaruh file (dan, untuk flyer/logo, mengisi tiga baris data). **Tidak ada komponen yang perlu diubah.**
Semua ini termasuk konten SAMPLE yang wajib terisi sebelum go-live.

| Aset | Taruh file di | Yang diisi | Ukuran ideal |
|---|---|---|---|
| Flyer rute / jersey / medali | `public/images/flyer/` | `src`, `width`, `height` di `src/data/flyer.ts` | Portrait 4:5, 1080×1350 px, di bawah ±500 KB |
| Logo SMADARUN (event) & SMADA (sekolah) | `public/images/logo/` | `src`, `width`, `height` di `src/data/logo.ts` | SVG atau PNG transparan, tinggi ≥ 120 px |
| Favicon | `src/app/` (lewat skrip) | tidak ada | Satu gambar persegi, ideal 512×512 PNG |
| OG image (pratinjau saat tautan dibagikan) | `src/app/` | tidak ada | 1200×630 px, JPG, di bawah ±300 KB |

Cek ukuran file di Mac: `sips -g pixelWidth -g pixelHeight <file>`.

## Flyer dan logo
Petunjuk lengkap ada di komentar kepala `src/data/flyer.ts` dan `src/data/logo.ts`. Selama `src`
kosong: flyer tampil kotak "Flyer segera hadir"; logo tidak tampil (situs memakai teks).
Penempatan logo: event di header + footer, sekolah di kicker hero + footer. Tanpa lightbox.

## Favicon
1. Siapkan SATU gambar persegi (lebar = tinggi), mis. `ikon.png` 512×512. Pastikan masih terbaca
   saat diperkecil jadi 32 px (logo sederhana, tanpa tulisan kecil).
2. Jalankan:
   ```bash
   bash scripts/pasang-ikon.sh path/ke/ikon.png
   ```
   Skrip membuat `src/app/icon.png` (512), `src/app/apple-icon.png` (180, ikon layar utama iPhone),
   dan `src/app/favicon.ico` (32, cadangan browser lama). Next.js memasang tag-nya otomatis.
3. Saat ini `src/app/favicon.ico` masih ikon sidik jari bawaan template (bukan identitas SMADARUN);
   akan tertimpa oleh langkah 2. Browser menyimpan favicon di cache — lihat di jendela privat.

## OG image
Gambar yang muncul saat tautan dibagikan (WhatsApp, Instagram DM, Facebook, X, dst).
1. Siapkan gambar **1200×630 px**, JPG, di bawah ±300 KB (WhatsApp menolak/memperlambat yang besar).
   Taruh nama/logo event di tengah — tepi atas-bawah sering terpotong di beberapa aplikasi.
2. Simpan sebagai `src/app/opengraph-image.jpg`. Untuk X/Twitter salin sebagai
   `src/app/twitter-image.jpg` (boleh gambar yang sama).
3. Opsional, deskripsi gambar: berkas teks `src/app/opengraph-image.alt.txt` berisi satu kalimat.
4. Next.js membaca ukurannya sendiri dan memasang `og:image`/`twitter:image` otomatis; tidak ada yang
   ditulis di `layout.tsx` (dulu menunjuk `/images/og-image.jpg` yang tidak ada → pratinjau kosong).
5. Platform menyimpan pratinjau lama di cache: setelah deploy, paksa segarkan lewat
   Facebook Sharing Debugger / WhatsApp (kirim ke diri sendiri tautan dengan `?v=2`).
Teks judul & deskripsi pratinjau berasal dari `src/data/siteDetails.ts` (`metadata`).

## Menguji lokal
`npm run dev`, lalu `curl -s localhost:3000/ | grep -E 'og:image|icon'` — tag harus muncul setelah file
ditaruh (restart dev server bila tidak terbaca). Tanpa file OG, tidak ada tag `og:image` sama sekali.
