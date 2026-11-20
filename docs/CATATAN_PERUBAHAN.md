# Catatan perubahan & keputusan

Urut terbaru di atas. Tiap entri: apa, kenapa, keputusan pemilik, dan yang masih terbuka.
Detail teknis ada di pesan commit (`git show <hash>`) dan di `INTEGRASI_CORE.md`.

---

## 20 November 2026 — Kartu tiket beranda hanya memuat kelompoknya sendiri

- Saat core punya kategori pelajar (nama memuat "pelajar") DAN kategori lain, kartu "5KM Pelajar" hanya
  menampilkan Kelompok U-18 (Podium) dan kartu "5KM Umum" hanya Kelompok Umum (Non-Podium). Aturannya sama
  dengan `src/lib/kategoriIdentitas.ts`; bila hanya satu kategori, kedua kelompok tetap tampil.
- Catatan podium ("Podium hanya untuk pelajar berdomisili Kab. Nganjuk …") dihapus dari SEMUA kartu atas
  permintaan pemilik (kartu umum dulu, lalu kartu pelajar); konstanta `catatanPodium` ikut dihapus.

---

## 19 November 2026 — Kartu Pelajar otomatis ke 5KM Pelajar

- Panitia memecah kategori di core menjadi "5KM Pelajar" (podium U-18) dan "5KM Umum". Kategori
  peserta kini mengikuti pilihan nomor identitas: Kartu Pelajar ke kategori pelajar, NIK ke umum.
  Dropdown hanya menampilkan kategori yang cocok, dan `api/daftar` menolak pasangan silang.
- Kategori pelajar dikenali dari kata "pelajar" pada nama tiket di core. Tanpa kategori pelajar
  (atau tanpa kategori lain) semua kategori terbuka seperti sebelumnya.
- Pilihan identitas tetap pengakuan peserta; kartu pelajar asli dicek panitia saat RPC dan podium.

## 19 November 2026 — Flyer utama dipasang di /daftar

- Flyer dari panitia (`public/images/flyer/flyer-utama.webp`, 1414×2000) dipasang lewat `flyerPendaftaran`
  di `src/data/flyer.ts`. Hanya halaman `/daftar` yang menampilkannya (ringkasan event di kiri/atas
  formulir); beranda tetap memakai mockup jersey, medali, dan string bag.
- Skeleton `src/app/daftar/loading.tsx` kini punya blok setinggi flyer supaya layar tidak melompat.
- Isi flyer memuat akun Instagram `@smadanganjuk_` dan `@osissmadangk`, berbeda dari keputusan pemilik
  (situs hanya `@smada.run_`). Itu gambar dari panitia, tidak diubah di sini.

---

## 19 November 2026 — Nama pendaftar otomatis kapital dan rapi

- Nama pemesan, peserta, dan kontak darurat menjadi kapital saat diketik; spasi awal/akhir dan spasi
  berlebih dirapikan saat keluar dari isian. Spasi akhir tetap bisa diketik untuk memulai kata berikutnya.
- Payload nama dan validasi server memakai aturan yang sama, termasuk permintaan dari tab lama.
  Email, nomor, opsi pilihan, dan teks tambahan lain tidak ikut dikapitalisasi.
- Kolom kontak darurat tetap dirender generik dari core; normalisasi nama hanya berlaku untuk kolom teks
  dengan penanda nama/name dan darurat/emergency pada key atau label.

---

## 19 November 2026 — Ukuran jersey dan biaya tambahan dari core

- Atas permintaan pemilik, kotak ringkasan kesalahan "Ada … isian yang perlu dilengkapi" beserta
  tombol "Tunjukkan isian pertama" dihapus. Pesan per isian, fokus ke isian bermasalah, dan validasi tetap berlaku.
- Pilihan ukuran dan `size_surcharges` dibaca dari kolom `semantic: "size"` pada form schema core.
  Tombol ukuran menampilkan biaya tambahan; ringkasan dan validasi server menambahkannya per peserta
  ke subtotal. Biaya layanan tetap per tiket. Tanpa kolom ukuran, daftar cadangan tanpa biaya tetap berlaku.
- Core publik telah diverifikasi mengirim tambahan Rp10.000 untuk XXL dan XXXL. Gambar size chart
  juga memuat nominal, sehingga asetnya perlu diganti bila tarif di core berubah.
- Catatan podium di ringkasan `/daftar` dihapus atas permintaan pemilik; tetap ada pada kartu tiket beranda.
- Ditambah pengujian pembacaan ukuran dan validasi nominal API; mock core lokal menyertakan biaya ukuran.
- Verifikasi: 115 tes, lint, TypeScript, dan build Webpack lolos; browser production lokal dengan mock
  menampilkan subtotal XXL dan total Rp196.000 (tiket Rp181.000 + ukuran Rp10.000 + layanan Rp5.000).
  Probe API tercatat di mock. Build Turbopack lokal terhalang izin port sandbox, bukan kesalahan kompilasi aplikasi.

---

## 19 November 2026 — Kontak panitia & sosial media

- Kontak panitia diganti tiga WhatsApp: 0821-4372-9459 (Gero), 0821-4027-7608 (Hanif), 0878-5640-3199 (Arsyad).
  Email `info@kembar.in` dihapus dari footer, FAQ, halaman status pesanan, tautan sponsor, dan Kebijakan Privasi.
- Sosial media hanya Instagram `@smada.run_` (X dan Facebook dibuang); footer menampilkan ikon + handle.
- Satu sumber data: `src/data/footer.ts` (`kontak`, `tautanWhatsApp`). Tautan sponsor "Hubungi panitia" menuju `#kontak` di footer.
- Teks Kebijakan Privasi berubah (kontak hak data pribadi: email → WhatsApp), jadi `VERSI_PERSETUJUAN` dinaikkan ke
  `smadarun-2026-11`; label lama tetap di `VERSI_PERSETUJUAN_DIKENAL`.

---

## 19 November 2026 — `/daftar` mengikuti alur formulir kembar.in

Keluhan pemilik: halaman terasa baku (hanya memanjang/memendek antara desktop dan ponsel) dan peserta bingung.
Percobaan pertama (stepper + kelompok isian dua lajur) dinilai terlalu banyak informasi; keputusan pemilik:
**samakan dengan alur core (kembar.in)**. Hanya tampilan; kontrak ke core, validasi server, dan payload tidak berubah.

- Tiga langkah berlabel sama dengan core: Tiket & Pemesan → Data Peserta → Tinjau & Bayar.
- Langkah 1: penghitung tiket (menggantikan "Tambah peserta") + nama/email/WhatsApp pemesan.
- Langkah 2: satu tiket per layar, pemilih tiket bila lebih dari satu, tombol "Gunakan data pemesan" (menyalin,
  tidak menautkan — `pemesanKey` kini selalu null), "Lanjut" membuka tiket berikutnya. Email/WhatsApp peserta
  dihapus dari UI; ukuran jersey/jenis kelamin berupa tombol pilih. Kategori dipilih di langkah 2 (select; kosong
  bila kategori lebih dari satu) dan total BARU tampil setelah itu — di langkah 1 bar menulis "Pilih kategori",
  sama dengan core (perbaikan 19 Nov 2026 atas temuan pemilik).
- Langkah 3: daftar ringkas dengan "Ubah" per tiket, dua persetujuan, tombol Bayar.
- Ringkasan event ala kembar.in: tanggal, lokasi, harga, dan "Termasuk …" di kiri (menempel) pada desktop, di atas
  formulir pada ponsel. **Keputusan pemilik: gambar cukup SATU flyer utama** (`flyerPendaftaran` di
  `src/data/flyer.ts`, BELUM ada filenya — selama kosong tidak ada kotak/placeholder; klik gambar = diperbesar)
  dan **benefit cukup teks "Termasuk …"** (`fasilitasSemuaKategori`), bukan gambar mockup. Rincian biaya ada di langkah 3; total di bar bawah
  ponsel / kaki kartu desktop.
- Pendaftaran ditutup: hanya pesan + tautan, tanpa formulir mati. Skeleton `loading.tsx` disesuaikan.

---

## 18 November 2026 — Revisi tampilan dari panitia (`REVISI WEB SMADA RUN 2027.pdf`)

- **Fasilitas:** label kecil "Fasilitas" dihapus; judul → "Fasilitas"; pengantar → "Nikmati pengalaman
  berlari bersama kami."; butir "Water Station Terjadwal" → "Tersedia Waterstation", "Pencatatan Waktu
  Akurat" dihapus, "Fotografer di Berbagai Titik" → "Fotografer di Spot Terbaik", "Lokasi Mudah
  Dijangkau" → "Racepack Menarik" (deskripsi & ikon ikut diganti karena yang lama membahas area parkir).
- **Mockup:** seksi "Rute, Jersey & Medali" → "Jersey, Medali & String Bag"; kalimat pengantar dihapus;
  slot Rute dicabut, slot String Bag ditambah. Mockup String Bag dipasang 18 Nov 2026 (`public/images/flyer/string-bag.webp`).
- **Galeri:** judul → "Recap SMADA RUN 2026" (ejaan "SMADA RUN" mengikuti dokumen revisi).
- **Tiket:** dua kelompok peserta (`kelompokPeserta` di `src/data/tiket.ts`) menggantikan teks "Menyusul" saat
  Coming Soon. Awalnya hanya tampil saat Coming Soon, sehingga HILANG begitu `coming_soon` dimatikan di core
  (19 Nov 2026) — sekarang tampil di kedua keadaan (saat buka, di atas harga). Ditambah catatan kecil
  `catatanPodium` ("Podium hanya untuk pelajar berdomisili Kab. Nganjuk; event terbuka untuk umum") di bawah
  kelompok pada kartu tiket dan di ringkasan event `/daftar`. Gaya mengikuti tema (garis tipis + lencana
  magenta "Podium" / netral "Non-Podium", huruf biasa), BUKAN meniru mockup poster panitia (kapital tebal).
- **Testimoni dihapus** (komponen, data, tautan menu "Testimoni"). Angka "1.000+" ikut dihapus atas
  keputusan pemilik (`src/data/stats.ts` & tipe `IStats` dibuang).

---

## 16 November 2026 — Tema "Jersey Violet": warna & pola dari desain jersey

Menggantikan "Warm Editorial" (amber/krem). Acuan: foto jersey SMADARUN 2027 (gradien ungu→biru indigo
dengan titik halftone magenta).

- Token `globals.css` diganti penuh (terang & gelap): lavender muda, tinta indigo, `--primary` magenta
  (`198 31 181`, teks putih), `--secondary` indigo, token baru `--hero-from/via/to` untuk gradien jersey.
- Kelas baru `.panel-jersey`; `.hero-atmosphere` kini gradien; `.hero-grid`/`.registration-grid` jadi pola titik.
- Komponen baru `PolaTitik.tsx` (SVG halftone berpilin, statis, satu path per lingkar). Dipakai di Hero, CTA, EventInfo.
- Hero: teks terang di atas gradien, foto inset dengan sudut atas membulat. Header transparan bertekstur terang
  di puncak beranda (`overHero`).
- Teks magenta di atas gradien diganti `text-on-secondary` (hitung mundur, label panel hari lomba) demi kontras.
- Burung hantu medali di hero: versi besar mengintip dari tepi atas panel foto (`public/images/logo/burung-hantu.png`, posisi horizontal sengaja di celah antara kata SMADARUN dan "2027"), versi ikon di baris kicker (`burung-hantu-ikon.png`). Keduanya dibuat skrip dari gambar garis mentah; ganti dengan SVG resmi bila ada. Skeleton `loading.tsx` ikut disesuaikan.
- Seksi "Rute, Jersey & Medali": gambar jersey dan medali dari panitia dipasang (`public/images/flyer/*.webp`, data di `src/data/flyer.ts`); kotak flyer kini seragam 4:5 dengan gambar `object-contain` di atas permukaan putih. Rute lintasan masih placeholder. Gambar jersey masih mockup bertulisan "APPAREL".
- Favicon (garis burung hantu putih dari lambang medali, sumber `scripts/aset/burung-hantu-garis.jpg`, di atas gradien) dan OG image (foto hero + gradien + judul) dibuat lewat `scripts/buat-aset-jersey.mjs`; ganti dengan logo resmi bila sudah ada. Seksi Tiket tetap terang dengan pola titik samar. Belum: logo putih dari jersey (`src/data/logo.ts` masih kosong).

## 12 Oktober 2026 — Fasilitas tiket tetap tampil saat kategori bertambah

- Daftar fasilitas yang berlaku untuk semua kategori dipisah di `src/data/tiket.ts` dan
  ditampilkan sekali di bawah kartu setiap kali ada kategori live, baik satu maupun lebih.
  Sebelumnya penambahan kategori di core tanpa metadata marketing lokal membuat irisan
  fasilitas kosong sehingga daftar bersama hilang.
- Fasilitas khusus kategori tetap bisa ditulis di `tiketMarketing[].features`. Harga,
  kategori, dan status ketersediaan tetap berasal dari core.

---

## 6 Oktober 2026 — Kembali dari gateway langsung ke ringkasan, tanpa panduan berkedip

Pemilik melihat pengantar + panduan langkah + "Memeriksa status pesanan…" setiap membuka tautan
kembali, sebelum ringkasan lunas muncul (pemeriksaan ke core ±1–3 detik). Halaman kembar.in tidak
punya jeda ini karena dirender server.

- `/daftar/status` kini membaca `?order=` di server (halaman dinamis, `kodeDariNilai`). Dengan
  `?order=`, HTML awal dan masa pemeriksaan pertama hanya kartu "Memeriksa pembayaran…" + kode;
  lalu ringkasan lunas, atau tampilan pending/tanpa token seperti biasa. Tanpa `?order=` tidak berubah.
- Uji: HTML server dengan `?order=` tidak menampilkan panduan (hanya ada di data RSC prop);
  browser tab baru → kartu memeriksa → ringkasan lunas.

---

## 6 Oktober 2026 — Tautan "Sudah bayar?" di form dihapus

Tautan ke `/daftar/status` di bawah tombol bayar (desktop) dan di atas persetujuan (ponsel) dulu
satu-satunya jalan kembali setelah membayar (hasil audit P5). Sejak gateway memulangkan pembeli
langsung ke `/daftar/status` (partnerReturnUrl), tautan itu tidak diperlukan dan form disamakan
dengan form kembar.in (keputusan pemilik). Halaman `/daftar/status` tetap ada sebagai tujuan
kembali; pesanan yang belum dibayar dilanjutkan lewat tautan bayar di email. Tombol modal
"Pesanan Sudah Lunas" kini berbunyi "Lihat ringkasan pembayaran".

---

## 6 Oktober 2026 — Token status pindah ke localStorage

Pemilik membuka tautan kembali di tab baru dan hanya mendapat tautan kembar.in: token status ada di
`sessionStorage`, yang per tab. Keputusan pemilik: simpan di `localStorage` supaya status terbaca
di tab mana pun pada perangkat & peramban yang sama.

- Kunci `smadarun:pesanan`: daftar `{ kode, statusToken?, t }`, terbaru dulu, maks 5 pesanan,
  lewat 30 hari diabaikan. Beli lagi = pesanan baru di depan; tautan kembali pesanan lama tetap
  bisa diperiksa (`pilihPesananTampil` mencari kodenya di daftar). "Lupakan" menghapus satu pesanan.
- Isi kunci lama `smadarun:pesanan-terakhir` (sessionStorage, tab yang terbuka sebelum rilis)
  dipindahkan sekali (`pindahkanPesananSesiLama`).
- Risiko yang diterima: orang lain di peramban yang sama bisa melihat status, total, dan metode
  pesanan itu — tanpa nama/email/NIK; halaman payment-return kembar.in menampilkan hal yang sama
  cukup dengan kode pesanan. Token tetap tidak pernah masuk URL atau log.

Diuji: 100 vitest; browser (build production + mock core): dua pesanan dibuat di satu tab, tab
baru `?order=` pesanan lama → ringkasan lunas, pesanan baru → pending, kode asing → tautan kembar.in.

---

## 6 Oktober 2026 — Halaman sukses disamakan dengan kembar.in

Permintaan pemilik: notifikasi sukses sesederhana halaman `payment-return` kembar.in, beserta
ringkasan pembayarannya.

- Pesanan lunas kini menggantikan pengantar dan panduan langkah dengan ringkasan: ikon centang,
  "Pembayaran terverifikasi", "N tiket telah diamankan. Konfirmasi dan e-ticket dikirim ke email
  pemesan.", lalu baris tipis Event / Kode pesanan / Total / Metode, dan catatan email + tautan
  Portal Peserta kembar.in (`/me/event/smadarun`). Komponen `RingkasanLunas` di `PemeriksaStatus.tsx`;
  pengantar & panduan dikirim `page.tsx` sebagai prop supaya bisa disembunyikan saat lunas.
- Total & metode datang dari core: `POST /api/public/orders/status` kini mengirim `totalAmount` dan
  `paymentMethod` (core commit `6cfca51`). Allowlist di `bersihkanStatus`: total angka ≥ 0, metode
  teks pendek `[A-Za-z0-9 ./-]`. Yang tidak dikirim core tidak ditampilkan (core lama = tanpa baris
  Total/Metode, bukan angka karangan).
- Beli lagi di tab yang sama: pesanan baru menggantikan pesanan terakhir di `sessionStorage`, jadi
  halaman sukses selalu milik pesanan yang baru dibayar.

Diuji: 97 vitest; browser (build production + mock core): pesanan 2 tiket lunas → ringkasan
Rp 372.000 / VA BCA, desktop dan ponsel 375px tanpa geser samping.

---

## 6 Oktober 2026 — Pembeli kembali ke smadarun.id setelah bayar

Sebelumnya gateway selalu memulangkan pembeli ke `kembar.in/events/smadarun/payment-return`.
Core kembarin-v2 kini menerima `partnerReturnUrl` dari partner terverifikasi (kontrak core §4b,
commit core `8ead231`).

- **`api/daftar` mengirim `partnerReturnUrl: "https://www.smadarun.id/daftar/status"`**
  (`URL_KEMBALI_PEMBAYARAN`, `src/lib/statusPesanan.ts`). Nilai tetap dari server; isian browser
  dengan nama yang sama dibuang. Harus `www`: smadarun.id dialihkan ke www, dan token status di
  `sessionStorage` hanya terbaca di origin tempat pendaftar mengisi form. Core hanya memakainya
  karena host-nya host tautan "Tiket dijual di" event smadarun (`https://www.smadarun.id`) dan
  karena kunci trusted-proxy cocok; selain itu core diam-diam memakai halaman kembar.in.
- **`/daftar/status` membaca `?order=`** (`kodeDariKueri`, `pilihPesananTampil`). Kode sama dengan
  pesanan tersimpan tab ini = diperiksa ke core seperti biasa. Kode lain (tab/perangkat lain)
  tampil tanpa token, hanya ditautkan ke kembar.in. **`result` tidak pernah dibaca**: bisa
  dikarang, dan gateway juga memulangkan pembeli yang baru memilih VA tanpa membayar.
- **Periksa ulang otomatis hanya setelah kembali dari gateway** (`perluPeriksaUlang`): status
  `pending` diperiksa lagi tiap 5 detik, paling banyak 12 kali (±1 menit; core 20/menit per
  pesanan). Konfirmasi gateway biasanya tiba beberapa detik setelah pembeli. Di luar itu tetap
  tidak ada pemeriksaan berkala; tombol "Periksa lagi" kini juga ada untuk status pending.
- Halaman tetap statis (kueri dibaca di browser lewat `useSyncExternalStore`).

Diuji: 96 uji vitest (uji baru gagal pada mutasi: nilai dari browser diteruskan; token pesanan
lain ikut terpakai); browser (build production + mock core): kembali dengan kode tersimpan →
pending lalu otomatis "Pembayaran diterima" setelah mock diubah ke `paid` lalu berhenti
memeriksa; kode palsu + `result=success` → hanya tautan kembar.in; tanpa `?order=` → satu kali
periksa; batas 1 + 12 pemeriksaan; ponsel 375px; console bersih.

Terbuka:
- Berlaku setelah core `8ead231` tayang. Core lama mengabaikan field ini, jadi urutan rilis aman
  dua arah; sebelum core tayang pembeli tetap kembali ke kembar.in.
- Pesanan yang tagihannya terbit sebelum rilis tetap kembali ke kembar.in.

---

## 6 Oktober 2026 — Skeleton loading diselaraskan dengan tema Warm Editorial

- `src/app/loading.tsx` (beranda) masih meniru hero lama (teks tengah + kartu tiket). Kini meniru hero
  sekarang: kicker → judul besar + garis tipis → foto selebar layar → panel hari lomba menumpuk di tepi foto
  → pembuka Fasilitas. Ukuran/jarak harus tetap sama dengan `Hero.tsx` dan `EventInfo.tsx`.
- `src/app/daftar/loading.tsx`: tambah latar + grid halus, kepala lengkap (label, judul, pengantar, caption),
  tiga tahap formulir, dan bar bayar ponsel (total kiri, tombol pendek kanan) agar tidak ada elemen yang muncul tiba-tiba.
- **Halaman status/pembayaran:** rute `/daftar/status` tidak punya `loading.tsx` sendiri, jadi memakai skeleton
  FORMULIR milik `/daftar` — bentuknya salah. Kini ada `src/app/daftar/status/loading.tsx` berbentuk ringkasan
  pembayaran. Kartu "Memeriksa pembayaran…" (kembali dari gateway) juga memakai kerangka yang sama
  (`KerangkaRingkasan`, judul & kode nyata) sehingga saat berubah menjadi "Pembayaran terverifikasi" tidak melompat.
- Halaman status diseragamkan: latar `registration-atmosphere` + grid (sebelumnya gradien dengan warna hex mentah,
  melanggar aturan token), label ala `/daftar`, tombol `font-semibold` tanpa bayangan.
- Potongan bersama di `src/components/Kerangka.tsx` (`Baris`, `Blok`, `KerangkaRingkasan`); warna lewat token,
  animasi `animate-pulse` mati pada reduced motion. Setiap kali tata letak halaman berubah, perbarui skeletonnya.
- Diuji dengan menunda render server sementara (dikembalikan): beranda, `/daftar`, `/daftar/status?order=`.
  Keadaan "pembayaran lunas" sungguhan belum diuji (butuh token & balasan core).

---

## 6 Oktober 2026 — Optimasi foto (semua foto ringan)

- Skrip `scripts/optimasi-foto.mjs <folder-asli>` (memakai `sharp`) mengecilkan foto dari berkas ASLI dan
  mencetak dimensi hasil. Salinan asli tetap di riwayat git (commit sebelumnya) — jalankan ulang dari sana
  bila perlu. Sebelumnya total `public/images` ±20 MB; lightbox galeri memuat berkas mentah 1–3 MB.
- **Hero:** `hero1.JPG` (6000×4000, 1,9 MB) → `hero-start.jpg` 2880×1884 (±500 KB), DIPOTONG ke area yang tampil
  (x 23–77%, y 25–78%). Teks "SMADA RUN 2026" (tengah-atas) dan "18 JANUARI 2026" (tengah-bawah) ada di
  TENGAH foto asli, bukan di tepi — potongan ini membuang keduanya. Zoom CSS `scale-[1.9]` dihapus
  (`object-[64%_center] sm:object-bottom`); `sizes="100vw"` kini benar karena foto tidak diregangkan.
- **Galeri:** `hero3–7.JPG` (1,1–3 MB) → `galeri-{podium,finis,juara,peserta,start}.jpg` lebar 2400 (±0,3–0,6 MB);
  `width/height` di `src/data/gallery.ts` = dimensi berkas baru (rasio sama, jadi grid `fr` tak berubah).
- Lain-lain: `pocari-1.jpg` (panduan jersey) 5,9 MB → 234 KB (dimensi di `DaftarForm` dikoreksi 1200×1600),
  avatar testimoni 98 KB → 9 KB, logo sponsor 145 KB → ±10 KB.
- Nama berkas BARU sengaja dipakai (bukan menimpa): cache optimizer Next/Vercel dikunci oleh URL, jadi nama
  yang sama bisa menyajikan foto lama. Jangan mengganti isi berkas tanpa mengganti namanya.
- Belum dihapus (tidak dipakai kode): `njr-1.png`, `njr-2*.png`, `kembarin2/3.png` di `public/images`.

---

## 6 Oktober 2026 — Hero: celah di bawah foto & foto buram

- **Celah krem di bawah foto hero** bukan karena foto kecil: section Hero punya `pb-16/pb-24`, sedangkan
  panel hari lomba hanya menimpanya `-mt-8/-mt-12`, jadi tersisa ±48px. Kini Hero tanpa padding bawah dan
  panel menumpuk di tepi bawah foto (`EventInfo`: `-mt-10 sm:-mt-14`). Terukur: celah +48px → −40..−56px.
- **Foto diregangkan (buram):** foto di-zoom `scale-[1.9]/1.85` agar teks "2026" terpotong, tetapi `sizes="100vw"`
  membuat browser memilih berkas selebar layar lalu diregangkan 1,85×. Kini `sizes="(min-width: 640px) 185vw, 190vw"`
  → rasio tampil/berkas 1,00. Berkas asli 6000×4000 (cukup). Harga: layar 1920px memuat varian 3840w (±0,9 MB).
  (Diselesaikan di entri "Optimasi foto" di atasnya: foto kini pra-crop dan zoom CSS dihapus.)

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
