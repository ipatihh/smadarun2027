/**
 * Simulasi pendaftaran KOLEKTIF ke sistem pendaftaran SMADARUN 2027.
 *
 * Satu "order" = satu pemesan (buyer) + 1..N peserta dalam satu pembayaran, sesuai
 * kontrak pesanan kolektif kembarin-v2. Script lama mengirim payload gaya lama
 * (field datar satu peserta) dengan eventCode 'smadarun2027' dan harga hardcode —
 * dua-duanya sudah usang dan pasti ditolak sekarang.
 *
 * DUA MODE TARGET (dideteksi otomatis dari TARGET_URL):
 *   core  → .../api/participants/register   payload peserta memakai `customFields`
 *   proxy → .../api/daftar                  payload peserta datar + flag persetujuan
 *
 * Harga, kategori, biaya layanan, dan batas tiket per pesanan TIDAK di-hardcode:
 * semuanya dibaca live dari endpoint publik event, supaya angka di script tidak
 * pernah melenceng dari pengaturan dasbor.
 *
 * Contoh pemakaian:
 *   node scratch/test_registration.js                    # 50 order ke core lokal
 *   DRY_RUN=1 node scratch/test_registration.js          # cetak payload, tanpa mengirim
 *   TOTAL_ORDERS=20 node scratch/test_registration.js
 *   TARGET_URL=http://localhost:3001/api/daftar TOTAL_ORDERS=3 node scratch/test_registration.js
 */

// ─── Konfigurasi ─────────────────────────────────────────────────────────────
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000/api/participants/register';
const EVENT_URL = process.env.EVENT_URL || 'https://kembar.in/api/public/events/smadarun';
const EVENT_CODE = process.env.EVENT_CODE || 'smadarun';

const TOTAL_ORDERS = Number(process.env.TOTAL_ORDERS || 50);
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 5);   // pesanan konkuren per batch
const DELAY_BETWEEN_BATCHES = Number(process.env.DELAY_BETWEEN_BATCHES || 300);

// 'manual' TIDAK memanggil payment gateway sama sekali. Jangan diganti ke 'doku'
// kecuali memang sedang menguji pembuatan transaksi — itu membuat transaksi asli.
const PAYMENT_GATEWAY = process.env.PAYMENT_GATEWAY || 'manual';

const DRY_RUN = process.env.DRY_RUN === '1';
const ALLOW_PRODUCTION = process.env.ALLOW_PRODUCTION === 'yes';

const isProxyMode = /\/api\/daftar\/?$/.test(new URL(TARGET_URL).pathname);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const rupiah = (n) => 'Rp ' + n.toLocaleString('id-ID');
const acak = (arr) => arr[Math.floor(Math.random() * arr.length)];

const GENDERS = ['Laki-laki', 'Perempuan'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const KOTA = ['Nganjuk', 'Surabaya', 'Kediri', 'Madiun', 'Malang', 'Blitar'];

// Validasi nama (di sini maupun di core) hanya mengizinkan huruf, spasi, titik, dan
// kutip — angka DITOLAK. Jadi penomoran bot dieja dengan kata, bukan digit.
const EJAAN = ['Nol', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'];
const ejaAngka = (n) => String(n).split('').map((d) => EJAAN[Number(d)]).join(' ');

// NIK wajib unik 16 digit — dijaga global supaya tidak bentrok antar pesanan.
let nikCounter = 0;
function nikUnik() {
  nikCounter += 1;
  const acakan = String(Math.floor(Math.random() * 1e6)).padStart(6, '0');
  return `3502${String(nikCounter).padStart(6, '0')}${acakan}`.slice(0, 16);
}

// ─── Data live dari kembarin-v2 ──────────────────────────────────────────────
async function ambilDataEvent() {
  const res = await fetch(EVENT_URL);
  if (!res.ok) throw new Error(`Gagal membaca data event (HTTP ${res.status}) dari ${EVENT_URL}`);
  const json = await res.json();
  if (!json || json.success !== true || !json.data) throw new Error('Respons data event tidak sesuai format.');

  const data = json.data;
  const cfg = data.event_config || {};
  const kategori = (data.ticket_types || [])
    .filter((t) => t.is_active === undefined || Number(t.is_active))
    .map((t) => ({ nama: t.category_name, harga: Number(t.price) || 0, id: t.id }))
    .filter((t) => t.nama && t.harga > 0);

  if (kategori.length === 0) throw new Error('Tidak ada kategori tiket aktif di event ini.');

  const multiTicket = cfg.multi_ticket_enabled !== false;
  const maxTiket = multiTicket
    ? Math.min(10, Math.max(2, Math.floor(Number(cfg.max_tickets_per_order) || 5)))
    : 1;

  return {
    kategori,
    maxTiket,
    multiTicket,
    // Biaya layanan dihitung PER TIKET (feePerTicket * jumlah tiket), bukan per pesanan.
    biayaLayananPerTiket: cfg.enable_admin_fee === true ? Number(cfg.admin_fee_amount) || 0 : 0,
    statusAktif: data.status === 'active' && cfg.registration_closed !== true,
  };
}

// ─── Perakitan payload ───────────────────────────────────────────────────────
function buatPesanan(nomorOrder, event) {
  const jumlahTiket = 1 + Math.floor(Math.random() * event.maxTiket);

  const buyer = {
    nama: `Pemesan Bot ${ejaAngka(nomorOrder)}`,
    email: `bot.pemesan.${nomorOrder}@example.com`,
    whatsapp: `0812${String(nomorOrder).padStart(4, '0')}${Math.floor(1000 + Math.random() * 9000)}`,
  };

  const peserta = Array.from({ length: jumlahTiket }, (_, i) => {
    const kategori = acak(event.kategori);
    const dasar = {
      nama: `Bot Runner ${ejaAngka(nomorOrder)} ${ejaAngka(i + 1)}`,
      // Peserta ke-2 dan seterusnya sengaja dikosongkan email/WA-nya untuk menguji
      // fallback ke data pemesan di sisi core.
      email: i === 0 ? `bot.runner.${nomorOrder}.${i + 1}@example.com` : '',
      whatsapp: '',
      nik: nikUnik(),
      gender: acak(GENDERS),
      kota: acak(KOTA),
      kategori: kategori.nama,
      size: acak(SIZES),
      _harga: kategori.harga,
      _ticketTypeId: kategori.id,
    };
    return dasar;
  });

  const subtotal = peserta.reduce((sum, p) => sum + p._harga, 0);
  const biayaLayanan = event.biayaLayananPerTiket * peserta.length;
  const total = subtotal + biayaLayanan;

  // Bentuk payload berbeda antara core dan proxy partner.
  const payload = isProxyMode
    ? {
        eventCode: EVENT_CODE,
        buyer,
        participants: peserta.map(({ _harga, _ticketTypeId, ...p }) => p),
        paymentGateway: PAYMENT_GATEWAY,
        health_declaration: true,
        privacy_consent: true,
        subtotal,
        total_amount: total,
      }
    : {
        eventCode: EVENT_CODE,
        buyer,
        participants: peserta.map((p) => ({
          nama: p.nama,
          email: p.email || buyer.email,
          ticketTypeId: p._ticketTypeId,
          customFields: {
            nik: p.nik,
            whatsapp: p.whatsapp || buyer.whatsapp,
            gender: p.gender,
            kota: p.kota,
            kategori: p.kategori,
            size: p.size,
          },
        })),
        paymentGateway: PAYMENT_GATEWAY,
      };

  return { payload, jumlahTiket, subtotal, biayaLayanan, total };
}

// ─── Pengiriman ──────────────────────────────────────────────────────────────
async function kirimPesanan(pesanan, nomorOrder) {
  const { payload, jumlahTiket, total } = pesanan;
  try {
    const response = await fetch(TARGET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const teks = await response.text();
    let hasil;
    try {
      hasil = JSON.parse(teks);
    } catch {
      hasil = { message: teks.slice(0, 120) };
    }

    if (response.ok && hasil.success !== false) {
      console.log(`[✓] Order #${nomorOrder} — ${jumlahTiket} tiket, ${rupiah(total)} — orderId: ${hasil.orderId || hasil.order_id || 'N/A'}`);
      return { success: true, jumlahTiket, total };
    }
    const pesan = hasil.message || `HTTP ${response.status}`;
    console.error(`[✕] Order #${nomorOrder} (${jumlahTiket} tiket) gagal: ${pesan}`);
    return { success: false, jumlahTiket, total, error: pesan };
  } catch (err) {
    console.error(`[✕] Order #${nomorOrder} exception: ${err.message}`);
    return { success: false, jumlahTiket, total, error: err.message };
  }
}

// ─── Runner ──────────────────────────────────────────────────────────────────
async function run() {
  const targetHost = new URL(TARGET_URL).host;

  // Script ini membuat pendaftaran SUNGGUHAN. Menembak production tanpa sadar akan
  // mengotori data peserta asli, jadi harus disengaja lewat ALLOW_PRODUCTION=yes.
  if (/kembar\.in|smadarun2027\.vercel\.app/.test(targetHost) && !ALLOW_PRODUCTION && !DRY_RUN) {
    console.error(`\n[BATAL] TARGET_URL mengarah ke production (${targetHost}).`);
    console.error('Script ini membuat pendaftaran sungguhan di database peserta.');
    console.error('Kalau memang disengaja, jalankan ulang dengan ALLOW_PRODUCTION=yes.\n');
    process.exit(1);
  }

  console.log('==================================================');
  console.log('Simulasi Pendaftaran Kolektif SMADARUN 2027');
  console.log(`Target      : ${TARGET_URL}`);
  console.log(`Mode payload: ${isProxyMode ? 'proxy partner (/api/daftar)' : 'core kembarin-v2'}`);
  console.log(`Gateway     : ${PAYMENT_GATEWAY}`);
  console.log(`Total order : ${TOTAL_ORDERS} (batch ${BATCH_SIZE}, jeda ${DELAY_BETWEEN_BATCHES}ms)`);
  if (DRY_RUN) console.log('DRY RUN     : payload dicetak, TIDAK dikirim');
  console.log('==================================================');

  const event = await ambilDataEvent();
  console.log(`Kategori aktif      : ${event.kategori.map((k) => `${k.nama} (${rupiah(k.harga)})`).join(', ')}`);
  console.log(`Biaya layanan       : ${rupiah(event.biayaLayananPerTiket)} PER TIKET`);
  console.log(`Batas tiket/pesanan : ${event.maxTiket}${event.multiTicket ? '' : ' (multi-tiket nonaktif)'}`);
  if (!event.statusAktif) console.log('PERINGATAN          : event tidak aktif / pendaftaran ditutup — semua order akan ditolak.');
  console.log('');

  if (isProxyMode && TOTAL_ORDERS > 3) {
    console.log('Catatan: proxy partner membatasi 3 pendaftaran per menit per IP,');
    console.log('jadi sebagian besar order di mode ini akan kena 429. Untuk uji beban,');
    console.log('arahkan TARGET_URL langsung ke endpoint core.\n');
  }

  if (DRY_RUN) {
    const contoh = buatPesanan(1, event);
    console.log('Contoh payload:\n');
    console.log(JSON.stringify(contoh.payload, null, 2));
    console.log(`\nRingkasan: ${contoh.jumlahTiket} tiket | subtotal ${rupiah(contoh.subtotal)} | biaya layanan ${rupiah(contoh.biayaLayanan)} | total ${rupiah(contoh.total)}`);
    return;
  }

  const mulai = Date.now();
  const statistik = { orderSukses: 0, orderGagal: 0, tiketSukses: 0, pendapatan: 0 };
  const errorTally = new Map();

  for (let i = 1; i <= TOTAL_ORDERS; i += BATCH_SIZE) {
    const akhir = Math.min(i + BATCH_SIZE - 1, TOTAL_ORDERS);
    const batch = [];
    for (let j = i; j <= akhir; j++) {
      batch.push(kirimPesanan(buatPesanan(j, event), j));
    }

    for (const res of await Promise.all(batch)) {
      if (res.success) {
        statistik.orderSukses++;
        statistik.tiketSukses += res.jumlahTiket;
        statistik.pendapatan += res.total;
      } else {
        statistik.orderGagal++;
        errorTally.set(res.error, (errorTally.get(res.error) || 0) + 1);
      }
    }

    if (akhir < TOTAL_ORDERS) await sleep(DELAY_BETWEEN_BATCHES);
  }

  const durasi = ((Date.now() - mulai) / 1000).toFixed(2);
  const feeTerkumpul = event.biayaLayananPerTiket * statistik.tiketSukses;

  console.log('\n==================================================');
  console.log(`Selesai dalam ${durasi} detik`);
  console.log(`Order berhasil : ${statistik.orderSukses}`);
  console.log(`Order gagal    : ${statistik.orderGagal}`);
  console.log(`Tiket terjual  : ${statistik.tiketSukses}`);
  console.log(`Nilai transaksi: ${rupiah(statistik.pendapatan)}`);
  console.log(`Biaya layanan  : ${rupiah(feeTerkumpul)} (${rupiah(event.biayaLayananPerTiket)} × ${statistik.tiketSukses} tiket)`);
  if (errorTally.size > 0) {
    console.log('\nRingkasan penyebab kegagalan:');
    [...errorTally.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([pesan, jumlah]) => console.log(`  ${String(jumlah).padStart(4)} × ${pesan}`));
  }
  console.log('==================================================');
}

run().catch((err) => {
  console.error('\n[FATAL]', err.message);
  process.exit(1);
});
