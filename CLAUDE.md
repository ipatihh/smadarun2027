# CLAUDE.md — smadarun2027

Landing page mandiri untuk event SMADARUN 2027. Baca `README.md` dulu untuk gambaran umum.
File ini berisi hal-hal yang tidak terlihat jelas dari sekadar membaca kode.

## Fakta arsitektur yang wajib dipahami sebelum mengubah apa pun

- **kembarin-v2 adalah sumber kebenaran mutlak**, project ini bukan. Harga tiket, kategori,
  status buka/tutup pendaftaran, DAN biaya layanan/admin (`event_config.admin_fee_amount`)
  SELALU di-fetch live dari kembarin-v2 (`src/lib/kembarinEvents.ts`), tidak pernah
  di-hardcode. `src/data/tiket.ts` HANYA boleh berisi metadata marketing/tampilan (nama
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
  tiket dan tetap membuat transaksi DOKU. Kalau menambah gerbang baru, tambahkan di sini,
  jangan di UI.
- `api/daftar/route.ts` membangun payload ke core secara EKSPLISIT dari field yang sudah
  divalidasi. JANGAN pernah mengembalikan pola `{ ...body }` — endpoint ini mengirim
  header trusted-proxy, jadi field liar dari klien akan sampai ke core sebagai request
  tepercaya. Persetujuan kesehatan & privasi juga wajib divalidasi di server (bukan cuma
  checkbox di browser) dan dicatat dengan timestamp buatan server.
- IP pengunjung dibaca lewat `getClientIp()`: `x-vercel-forwarded-for` dulu, lalu entri
  PALING KANAN dari `x-forwarded-for`. Memakai seluruh string `x-forwarded-for` (perilaku
  lama) membuat rate limiter bisa dilewati cukup dengan mengarang header.
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

## Aturan sistem desain (UI)

- **Warna, radius, dan bayangan HANYA boleh lewat token.** Semua nilai mentah tinggal di
  `src/app/globals.css` (`:root` + blok `prefers-color-scheme: dark`) dan dipetakan di
  `tailwind.config.ts`. Di komponen JANGAN pakai palet Tailwind mentah (`bg-white`,
  `text-black`, `gray-*`, `zinc-*`, `amber-*`, dst) — pakai `bg-card`, `bg-surface-sunken`,
  `text-on-primary`, `text-on-secondary`, `bg-warning-surface`, `rounded-card|field|panel`,
  `shadow-rest|hover`. Sebelum ini permukaan abu-abu di form punya 3 nuansa berbeda tanpa
  alasan dan mode gelap mustahil ditambahkan. Kuning `--primary` adalah warna PERMUKAAN,
  bukan warna teks di latar terang (kontrasnya ±1.6:1).
- **Mode gelap otomatis ikut setelan sistem** — tidak ada toggle. Setiap warna baru wajib
  punya pasangan di blok `@media (prefers-color-scheme: dark)`, kalau tidak akan hilang
  kontras di mode gelap.
- **Tidak ada framer-motion lagi** (sudah di-uninstall). Reveal memakai kelas CSS `.reveal`
  + `.reveal-1..4` di `globals.css`. Alasannya bukan sekadar bundle: animasi berbasis JS
  membuat konten ber-`opacity: 0` sampai hidrasi selesai — pada tab yang tidak aktif
  (rAF di-throttle) formulir pendaftaran pernah benar-benar tidak terlihat. Reveal CSS
  jalan tanpa JS dan otomatis mati lewat `prefers-reduced-motion`.
- **`src/data/**` HARUS tetap ada di daftar `content` Tailwind.** File data di sini ikut
  menulis kelas Tailwind (ukuran kotak logo di `sponsors.ts`, warna ikon di `stats.tsx`).
  Waktu folder itu belum masuk `content`, kelasnya diam-diam tidak ikut di-generate:
  tidak ada error, tidak ada peringatan, elemennya hanya tampil tanpa ukuran (kotak logo
  sponsor ikut ukuran gambar asli, bukan ukuran tier-nya). Kalau menambah folder data
  baru yang memuat className, tambahkan juga globnya.
- **Semua modal wajib pakai `Dialog` dari `@headlessui/react`** (sudah jadi dependency),
  bukan div overlay manual — supaya dapat Escape, focus trap, dan pengembalian fokus.
- Bar aksi mobile (`StickyDaftarBar`) mengambil harga termurah dari `layout.tsx`; harga itu
  tetap live dari kembarin-v2, jangan di-hardcode di komponennya.

## Gotcha operasional

- **Sebagian besar konten masih SAMPLE dan memang disengaja** (per Agustus 2026): testimoni
  beserta avatarnya, angka di seksi statistik, nomor telepon & tautan sosial media di
  `src/data/footer.ts`, logo sponsor di `public/images/sponsors/`, foto hero & benefit, dan
  gambar panduan ukuran jersey. Event-nya sendiri belum berjalan. Jangan "membetulkan" isinya
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
