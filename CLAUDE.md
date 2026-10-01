# CLAUDE.md — smadarun2027

Landing page mandiri untuk event SMADARUN 2027. Baca `README.md` dulu untuk gambaran umum.
File ini berisi hal-hal yang tidak terlihat jelas dari sekadar membaca kode.

## Fakta arsitektur yang wajib dipahami sebelum mengubah apa pun

- **kembarin-v2 adalah sumber kebenaran mutlak**, project ini bukan. Harga tiket, kategori,
  status buka/tutup pendaftaran, biaya layanan/admin (`event_config.admin_fee_amount`),
  DAN aturan pembelian kolektif (`multi_ticket_enabled`, `max_tickets_per_order`) SELALU
  di-fetch live dari kembarin-v2 (`src/lib/kembarinEvents.ts`), tidak pernah di-hardcode. `src/data/tiket.ts` HANYA boleh berisi metadata marketing/tampilan (nama
  tampilan, daftar fasilitas, `badge`, `highlight`) — jangan pernah tambahkan field
  harga/isAvailable/adminFee ke situ lagi.
  Ini sudah 2x jadi sumber bug: kategori/harga tiket (commit `1b80757`, `3a337ae`), lalu biaya
  layanan platform yang sempat hardcode Rp5.000 padahal admin sudah ubah jadi Rp2.000 di
  kembarin-v2 (`event_config.enable_admin_fee` + `admin_fee_amount`) — kalau nanti nambah
  field baru dari kembarin-v2, cek dulu apakah field itu memang dibaca live di
  `kembarinEvents.ts`, jangan asumsi otomatis ikut.
- Status buka/tutup TIDAK cuma `event.status`. `getLiveEventData()` menggabungkan empat
  gerbang: `status === "active"`, `event_config.registration_closed !== true`,
  `registration_open_at` sudah lewat, dan ada minimal satu `ticket_types[].is_active`.
  Tiga gerbang terakhir sempat tidak dibaca sama sekali — akibatnya admin bisa menutup
  pendaftaran atau menonaktifkan kategori di dasbor, tapi partner site ini tetap menjual
  tiket dan tetap membuat transaksi payment gateway. Kalau menambah gerbang baru, tambahkan di sini,
  jangan di UI.
- **Biaya layanan dihitung PER TIKET, bukan per pesanan.** Core memakai
  `calculateAdminFee(... , ticketCount)` = `feePerTicket * ticketCount`, jadi pesanan 5
  tiket ditagih 5 × `admin_fee_amount`. Semua tempat yang menampilkan/menghitung nominal
  di project ini WAJIB mengalikan dengan jumlah peserta — kalau tidak, angka di layar
  lebih kecil daripada yang ditagihkan payment gateway.
- **Pendaftaran memakai kontrak pesanan kolektif** `{ buyer, participants[] }` ke
  `POST /api/participants/register`. Kalau payload memuat array `participants`,
  `ParticipantService` langsung menyerahkannya ke `RegistrationOrderService` (hitung ulang
  harga zero-trust, kuota atomik, satu order + satu pembayaran payment gateway). Payload gaya lama
  (field datar satu peserta) masih diterima core tapi dinormalisasi jadi pesanan 1 tiket —
  jangan kembali ke bentuk itu. Batasnya dibaca live dari `multi_ticket_enabled` dan
  `max_tickets_per_order`, dengan rumus penjepit yang sama seperti core (DEFAULT 5,
  ABSOLUTE 10) — kalau angka di sini lebih longgar, peserta baru ditolak setelah mengisi
  formulir panjang. Email/WhatsApp peserta boleh kosong; core mem-fallback ke data pemesan.
- `api/daftar/route.ts` membangun payload ke core secara EKSPLISIT dari field yang sudah
  divalidasi. JANGAN pernah mengembalikan pola `{ ...body }` — endpoint ini mengirim
  header trusted-proxy, jadi field liar dari klien akan sampai ke core sebagai request
  tepercaya. Persetujuan kesehatan & privasi juga wajib divalidasi di server (bukan cuma
  checkbox di browser) dan dicatat dengan timestamp buatan server.
- **Gateway pembayaran dipilih core, bukan situs ini.** `api/daftar` selalu mengirim
  `paymentGateway: "auto"` (nilai dari browser diabaikan); core memilih gateway otomatis
  yang diizinkan `allowed_payment_gateways` event + saklar global + batas QRIS-only, dan
  tidak pernah memilih transfer manual. JANGAN menamai gateway di sini lagi — hardcode
  `"doku"` lalu `"midtrans"` dua kali membuat SELURUH pendaftaran gagal (500) begitu
  panitia mematikan gateway itu di dasbor. Kalau gateway baru dipakai, cukup tambahkan
  domain induknya ke `ALLOWED_PAYMENT_DOMAINS` di `src/lib/paymentUrl.ts` (mode sandbox/produksi tidak perlu diubah — subdomain ikut diterima). Core yang belum mengenal
  `"auto"` menolak dengan "Metode pembayaran tidak valid" — deploy kembarin-v2 lebih dulu.
- IP pengunjung dibaca lewat `getClientIp()`: `x-vercel-forwarded-for` dulu, lalu entri
  PALING KANAN dari `x-forwarded-for`. Memakai seluruh string `x-forwarded-for` (perilaku
  lama) membuat rate limiter bisa dilewati cukup dengan mengarang header.
- Server (`api/daftar/route.ts`) juga fetch live data sendiri untuk validasi ulang harga —
  JANGAN percaya nominal/subtotal/total yang dikirim client, walau kembarin-v2 sendiri juga
  sudah zero-trust terhadap ini (defense-in-depth, bukan redundan sia-sia).
- `event_code` yang dipakai adalah **`"smadarun"`**, BUKAN `"smadarun2027"` — kembarin-v2
  sudah rename dari `smadarun2027` ke `smadarun` (lihat commit `625705b`). Nama project,
  domain (`smadarun.id`), dan branding UI tetap "SMADARUN 2027" — itu berbeda
  dari event_code teknis. Jangan bingung antara keduanya.
- Endpoint yang dipakai untuk baca data live: `GET /api/public/events/[eventCode]` (lookup
  per-kode, tidak terpengaruh `show_in_gallery`) — BUKAN `GET /api/public/events` (listing
  bulk kembar.in sendiri yang terfilter `show_in_gallery`). Kalau butuh integrasi serupa
  untuk event lain, endpoint per-kode ini yang benar dipakai.
- Kalau fetch ke kembarin-v2 gagal (network error, 5xx, dsb), kode selalu **fail-closed** —
  dianggap "pendaftaran tertutup", bukan pakai data lama/fallback. Ini prinsip yang harus
  dipertahankan di kode terkait pembayaran: lebih baik gagal aman daripada menampilkan
  harga/status yang sudah usang. Fetch juga dibatasi timeout 8 detik (`AbortSignal.timeout`)
  supaya kembar.in yang menggantung (bukan error jelas) tidak ikut menggantungkan render
  halaman tanpa batas.
- **Kategori tiket dicocokkan lewat `id` (ticketTypeId) kalau tersedia**, bukan cuma nama.
  `LiveTicketType.id` dikirim sebagai `ticketTypeId` ke core, yang mencoba match by ID lebih
  dulu sebelum jatuh ke match by nama kategori — jadi kalau admin ganti nama kategori di
  tengah jalan, peserta yang sudah pilih kategori itu di form tetap match dengan benar.
- **Isian `nik` menampung NIK ATAU nomor kartu pelajar** (pilihan per peserta,
  `jenisIdentitas`). Aturannya hanya di `src/lib/identitas.ts` — form dan `api/daftar`
  sama-sama memakainya; jangan menulis regex NIK lagi di salah satunya. NIK tetap tepat
  16 digit (salah ketik tetap tertangkap); kartu pelajar 4–16 karakter. Batas 16 itu
  disengaja: core menerima sampai 32, tapi panjang kolom `nik` di database belum
  dipastikan — 16 pasti muat karena NIK sendiri 16. Core menyimpan keduanya di kolom
  `nik` yang sama, jadi `api/daftar` ikut mengirim `customFields.jenis_identitas`
  ("NIK"/"Kartu Pelajar") supaya panitia tahu mana yang dipakai.
- **Dropdown wilayah mengikuti toggle core**, bukan keputusan project ini. `kembarinEvents.ts`
  membaca `event_config.enable_wilayah_dropdown` (hanya nilai tepat `true` = menyala, sama
  seperti formulir kembar.in); menyala = `WilayahSelect`, mati = isian teks bebas tanpa kode.
  `api/daftar` menerima kedua bentuk apa pun kondisi toggle-nya, karena tab yang dibuka
  sebelum toggle berubah masih mengirim bentuk lama.
- **Saat dropdown menyala, domisili wajib dikirim sebagai KODE wilayah**, bukan cuma teks. `api/daftar` meneruskan
  `customFields.__wilayah_prov` / `__wilayah_kota` (kontrak `RegistrationOrderService` core);
  tanpa itu core hanya menyimpan teks `kota` dan `prov_code/kota_code` di dasbor kosong —
  dropdown di form jadi sia-sia (pernah terjadi: provinsi pilihan peserta dibuang).
  Nama kota diturunkan server dari kode, teks dari browser hanya dipakai untuk isian manual.
  `public/data/wilayah/*.json` adalah salinan persis milik kembarin-v2 — kalau core
  memperbarui datasetnya, salin ulang, kalau tidak kabupaten baru ditolak core.
- **`FooterLive.tsx` sengaja membungkus fetch live-nya sendiri dalam `Suspense` terpisah** —
  JANGAN pindahkan `getLiveEventData()` balik ke root layout (`layout.tsx`) yang `async`.
  Itu pernah membuat SATU fetch (buat teks biaya layanan di footer) menahan render SELURUH
  halaman (header, hero, semuanya) sampai kembar.in selesai merespons. Pola sekarang: header
  & konten utama tampil seketika, cuma footer yang menyusul.

## Aturan sistem desain (UI)

- **Warna, radius, dan bayangan HANYA boleh lewat token.** Semua nilai mentah tinggal di
  `src/app/globals.css` (`:root` + blok `prefers-color-scheme: dark`) dan dipetakan di
  `tailwind.config.ts`. Di komponen JANGAN pakai palet Tailwind mentah (`bg-white`,
  `text-black`, `gray-*`, `zinc-*`, `amber-*`, dst) — pakai `bg-card`, `bg-surface-sunken`,
  `text-on-primary`, `text-on-secondary`, `bg-warning-surface`, `rounded-card|field|panel`,
  `shadow-rest|hover`. Sebelum ini permukaan abu-abu di form punya 3 nuansa berbeda tanpa
  alasan dan mode gelap mustahil ditambahkan. Kuning `--primary` adalah warna PERMUKAAN,
  bukan warna teks di latar terang (kontrasnya ±1.6:1) — angka "2027" di logotype memakai
  kelas `.accent-mark` (blok kuning, teks gelap). Begitu juga `--secondary`: itu warna
  panel gelap, BUKAN warna teks — `text-secondary` sempat dipakai di 9 tempat dan semuanya
  nyaris hilang di mode gelap. Untuk teks pakai `text-foreground`/`text-foreground-accent`.
- **Nilai token ditulis sebagai kanal RGB (`254 216 53`), bukan hex.** Tailwind memetakannya
  jadi `rgb(var(--x) / <alpha-value>)`; hanya dengan format ini kelas opacity seperti
  `bg-card/90` atau `ring-primary/25` ikut di-generate. Waktu token masih hex, 8 kelas
  semacam itu diam-diam tidak pernah ada (tanpa error): header & bar bayar `/daftar` jadi
  tembus pandang dan cincin fokus input jatuh ke biru bawaan Tailwind. Di CSS biasa tulis
  `rgb(var(--x))`.
- **Mode gelap otomatis ikut setelan sistem** — tidak ada toggle. Setiap warna baru wajib
  punya pasangan di blok `@media (prefers-color-scheme: dark)`, kalau tidak akan hilang
  kontras di mode gelap.
- **Tidak ada framer-motion lagi** (sudah di-uninstall). Reveal memakai kelas CSS `.reveal`
  + `.reveal-1..4` di `globals.css`. Alasannya bukan sekadar bundle: animasi berbasis JS
  membuat konten ber-`opacity: 0` sampai hidrasi selesai — pada tab yang tidak aktif
  (rAF di-throttle) formulir pendaftaran pernah benar-benar tidak terlihat. Reveal CSS
  jalan tanpa JS dan otomatis mati lewat `prefers-reduced-motion`.
- **`src/data/**` HARUS tetap ada di daftar `content` Tailwind.** File data di sini ikut
  menulis kelas Tailwind (ukuran kotak logo di `sponsors.ts`).
  Waktu folder itu belum masuk `content`, kelasnya diam-diam tidak ikut di-generate:
  tidak ada error, tidak ada peringatan, elemennya hanya tampil tanpa ukuran (kotak logo
  sponsor ikut ukuran gambar asli, bukan ukuran tier-nya). Kalau menambah folder data
  baru yang memuat className, tambahkan juga globnya.
- **Semua modal wajib pakai `Dialog` dari `@headlessui/react`** (sudah jadi dependency),
  bukan div overlay manual — supaya dapat Escape, focus trap, dan pengembalian fokus.
- **Bar aksi melayang hanya boleh ada di `/daftar`**, tidak di beranda. Beranda pernah
  punya `StickyDaftarBar` (harga termurah + tombol daftar) dan itu dicopot: header sudah
  memuat tombol "Daftar" yang selalu terlihat, jadi bar itu CTA kedua yang menutupi
  konten tanpa menambah jalan menuju pendaftaran.
- **Satu informasi, satu tempat.** Isi race pack hanya di seksi Tiket (`tiket.ts`), jadwal
  hari-H (tanggal, lokasi, gun start, RPC) hanya di panel `EventInfo.tsx`. Sebelumnya isi race
  pack diulang di Benefits, kotak fasilitas Tiket, dan FAQ sekaligus — itu yang membuat
  halaman terasa panjang dan tidak sederhana. Jangan menambah seksi/FAQ yang mengulangnya.

## Gotcha operasional

- **Sebagian besar konten masih SAMPLE dan memang disengaja** (per Agustus 2026): testimoni
  beserta avatarnya, angka statistik (`stats.ts`, tampil di kepala seksi testimoni), nomor
  telepon & tautan sosial media di `src/data/footer.ts`, logo sponsor di
  `public/images/sponsors/`, ilustrasi hero (`public/images/hero-illustration.svg`, dibuat
  lewat skrip, bukan aset panitia), foto galeri "momen tahun lalu" (`src/data/gallery.ts`),
  dan gambar panduan ukuran jersey. **Slot foto adalah bagian dari wadah**: panitia
  merencanakannya untuk foto event tahun lalu, jadi saat menyederhanakan tata letak jangan
  menghapus tempat foto walau isinya jelas contoh (pernah terjadi di Benefits; fotonya
  kemudian dipindah ke galeri). Event-nya sendiri belum berjalan. Jangan "membetulkan" isinya
  atau menganggapnya data nyata — yang harus dijaga adalah wadahnya (struktur data, tata
  letak, aksesibilitas). Sebelum go-live, semua itu wajib diganti aset/teks asli panitia.
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
