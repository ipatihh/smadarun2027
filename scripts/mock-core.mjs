// Mock core kembarin-v2 untuk uji lokal smadarun2027. TIDAK pernah menghubungi kembar.in.
// Cara pakai & prosedur keamanan: docs/PENGUJIAN.md.
//
//   node scripts/mock-core.mjs            # port 4010 (atau MOCK_CORE_PORT)
//
// Endpoint (meniru kontrak partner core, docs/PARTNER_INTEGRATION.md di kembarin-v2):
//   GET  /api/public/events/smadarun     data live: terbuka, 1 kategori, kolektif maks 5
//   POST /api/participants/register      perilaku sesuai mode (di bawah)
//   POST /api/public/orders/status       status pesanan (butuh statusToken yang cocok)
// Kendali uji:
//   GET /__mode?m=<mode>                 ganti mode pendaftaran
//   GET /__status?kode=X&st=<status>     ubah status pesanan (pending|paid|expired|cancelled)
//   GET /__status?fitur=belum-aktif      endpoint status menjawab 503 ORDER_STATUS_UNAVAILABLE
//   GET /__log                           ringkasan permintaan (tanpa nilai rahasia)
//   GET /__namabib?on=0|1                pasang/lepas kolom Nama BIB di form_schema (bawaan: pasang)
//   GET /__tambahan?on=0|1               pasang/lepas kolom tambahan (kontak darurat dll., bawaan: pasang)
//
// PENGAMAN: kategori tiket mock sengaja bernama "UJI LOKAL 5K" (id 987654, Rp181.000) — tidak
// ada di core production. Kalau server uji ternyata salah alamat ke production, data live-nya
// tidak memuat kategori ini sehingga api/daftar menolak sebelum mencapai core, dan core
// production pun akan menolak kategori yang tidak dikenalnya. Jangan ganti ke nama kategori asli.
import http from "node:http";

const PORT = Number(process.env.MOCK_CORE_PORT || 4010);

const MODE = {
  sukses: "pesanan pending + paymentUrl sandbox + statusToken",
  "tanpa-token": "seperti sukses, tanpa statusToken (core tanpa ORDER_STATUS_TOKEN_SECRET)",
  lunas: "pesanan status paid",
  rusak: "200 {} (respons di luar kontrak)",
  asing: "paymentUrl di domain bukan gateway",
  "tanpa-tautan": "pending tanpa paymentUrl",
  tolak: "409 REGISTRATION_VALIDATION_FAILED",
  error500: "500 REGISTRATION_INTERNAL_ERROR",
  gateway: "400 PAYMENT_GATEWAY_CREATION_FAILED",
  proses: "503 REGISTRATION_ORDER_PROCESSING + Retry-After",
  identitas: "409 REGISTRATION_IDENTITY_PENDING_ORDER",
  beda: "409 REGISTRATION_IDEMPOTENCY_MISMATCH",
  timeout: "tidak pernah menjawab (proxy timeout 25 dtk)",
  "timeout-lalu-ada": "membuat pesanan lalu menggantung; mode berikutnya otomatis sukses",
  "body-macet": "kirim header + sebagian body lalu berhenti",
};

let mode = "sukses";
let namaBibAktif = true;
let tambahanAktif = true;
// Cermin field form_schema core bertipe `name_on_bib` (kembarin-v2 domains/shared/nameOnBib.ts).
const KOLOM_NAMA_BIB = { name: "nama_bib", type: "name_on_bib", label: "Name On BIB", required: false, maxLength: 15, semantic: "name_on_bib" };
// Cermin keluaran toPublicFormSchema core (kembarin-v2 domains/shared/publicFormSchema.ts):
// field inti bertanda `semantic`, kolom tambahan panitia `semantic: null`.
const KOLOM_INTI = [
  { name: "nama", type: "text", label: "Nama Lengkap", required: true, semantic: "nama", maxLength: 1000 },
  { name: "nik", type: "text", label: "NIK", required: true, semantic: "nik", maxLength: 1000 },
  { name: "kategori", type: "select", label: "Kategori", options: ["UJI LOKAL 5K"], required: true, semantic: "kategori" },
];
const KOLOM_TAMBAHAN = [
  { name: "kontak_darurat_nama", type: "text", label: "Nama Kontak Darurat", required: true, placeholder: "", semantic: null, maxLength: 1000 },
  { name: "kontak_darurat_nomor", type: "tel", label: "Nomor Kontak Darurat", required: true, placeholder: "08xxxxxxxxxx", semantic: null, maxLength: 16, pattern: "^\\+?[0-9]{8,15}$" },
  { name: "golongan_darah", type: "select", label: "Golongan Darah", options: ["A", "B", "AB", "O"], required: false, placeholder: "", semantic: null },
];
let fiturStatus = "aktif";
let nomor = 0;
const log = [];
const pesananPerSesi = new Map(); // emulasi idempotency_key core
const pesananPerKode = new Map();

// Token sintetis 43 karakter base64url (bentuk sama dengan HMAC-SHA256 core, nilainya bukan HMAC).
const tokenUntuk = (kode) => Buffer.from(`tok-${kode}`.padEnd(32, "x")).toString("base64url").slice(0, 43);

const LIVE = {
  success: true,
  data: {
    event_code: "smadarun",
    status: "active",
    event_date: null,
    location: null,
    ticket_types: [{ id: 987654, category_name: "UJI LOKAL 5K", price: 181000, is_active: 1 }],
    event_config: {
      enable_admin_fee: true,
      admin_fee_amount: 5000,
      multi_ticket_enabled: true,
      max_tickets_per_order: 5,
      enable_wilayah_dropdown: true,
    },
  },
};

function json(res, status, body, headers = {}) {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

function bacaBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => resolve(body));
  });
}

function pesananBaru(sessionId, ticketCount, denganToken = true) {
  nomor += 1;
  const kode = `UJI-${String(nomor).padStart(4, "0")}`;
  const order = {
    success: true,
    message: `Pesanan ${kode} berhasil dibuat. Silakan selesaikan pembayaran.`,
    status: "pending",
    orderId: 1000 + nomor,
    orderCode: kode,
    ticketCount,
    participantIds: [1],
    paymentUrl: `https://app.sandbox.midtrans.com/snap/v4/redirection/uji-lokal-${kode}`,
    paymentExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
    token: "token-gateway-palsu",
    paymentGateway: "midtrans",
    ...(denganToken ? { statusToken: tokenUntuk(kode) } : {}),
  };
  if (sessionId) pesananPerSesi.set(sessionId, order);
  pesananPerKode.set(kode, { status: "pending", order });
  return order;
}

async function daftar(req, res) {
  const data = JSON.parse(await bacaBody(req));
  const sessionId = data.sessionId || null;
  log.push({
    waktu: new Date().toISOString(),
    jalur: "register",
    mode,
    sessionId,
    adaKunciTrustedProxy: Boolean(req.headers["x-trusted-proxy-key"]),
    kunciTopLevel: Object.keys(data),
    partnerReturnUrl: data.partnerReturnUrl ?? null,
    peserta: (data.participants || []).map((p) => ({ nama: p.nama, nik: p.customFields?.nik, size: p.customFields?.size, namaBib: p.customFields?.nama_bib, darurat: [p.customFields?.kontak_darurat_nama, p.customFields?.kontak_darurat_nomor, p.customFields?.golongan_darah] })),
  });
  if (sessionId && pesananPerSesi.has(sessionId) && mode !== "timeout-lalu-ada") {
    const lama = pesananPerSesi.get(sessionId);
    return json(res, 200, { ...lama, message: `Pesanan ${lama.orderCode} sudah dibuat sebelumnya.` });
  }
  const jumlah = (data.participants || []).length;
  switch (mode) {
    case "sukses":
      return json(res, 200, pesananBaru(sessionId, jumlah));
    case "tanpa-token":
      return json(res, 200, pesananBaru(sessionId, jumlah, false));
    case "lunas":
      return json(res, 200, { ...pesananBaru(sessionId, jumlah), status: "paid", paymentUrl: undefined });
    case "rusak":
      return json(res, 200, {});
    case "asing":
      return json(res, 200, { ...pesananBaru(sessionId, jumlah), paymentUrl: "https://evil.example/bayar" });
    case "tanpa-tautan":
      return json(res, 200, { ...pesananBaru(sessionId, jumlah), paymentUrl: undefined });
    case "tolak":
      return json(res, 409, { success: false, code: "REGISTRATION_VALIDATION_FAILED", message: "NIK sudah terdaftar pada event ini.", retryable: false });
    case "error500":
      return json(res, 500, { success: false, code: "REGISTRATION_INTERNAL_ERROR", message: "Terjadi kesalahan sistem internal.", retryable: true });
    case "gateway":
      return json(res, 400, { success: false, code: "PAYMENT_GATEWAY_CREATION_FAILED", message: "Pembayaran Online belum dapat diproses. Silakan hubungi panitia.", retryable: false });
    case "proses":
      return json(
        res,
        503,
        { success: false, code: "REGISTRATION_ORDER_PROCESSING", message: "Invoice pembayaran untuk pesanan UJI-PROSES sedang diproses.", retryable: true, retryAfterSeconds: 5, orderCode: "UJI-PROSES" },
        { "Retry-After": "5" }
      );
    case "identitas":
      return json(res, 409, {
        success: false,
        code: "REGISTRATION_IDENTITY_PENDING_ORDER",
        message: "Nomor identitas ini sudah ada di pesanan UJI-LAMA yang menunggu pembayaran. Bayar lewat tautan di email pemesan.",
        retryable: false,
        orderCode: "UJI-LAMA",
        paymentExpiresAt: new Date(Date.now() + 1800_000).toISOString(),
      });
    case "beda":
      return json(res, 409, {
        success: false,
        code: "REGISTRATION_IDEMPOTENCY_MISMATCH",
        message: "Halaman ini sudah membuat pesanan UJI-BEDA dengan isi berbeda. Muat ulang halaman lalu isi kembali untuk membuat pesanan baru.",
        retryable: false,
        orderCode: "UJI-BEDA",
      });
    case "timeout":
      return; // tidak pernah menjawab
    case "timeout-lalu-ada":
      pesananBaru(sessionId, jumlah);
      mode = "sukses";
      return;
    case "body-macet":
      res.writeHead(200, { "content-type": "application/json" });
      res.write('{"success":true,');
      return;
    default:
      return json(res, 500, { success: false, message: `mode tidak dikenal: ${mode}` });
  }
}

async function statusPesanan(req, res) {
  const d = JSON.parse(await bacaBody(req));
  log.push({ waktu: new Date().toISOString(), jalur: "status", adaKunciTrustedProxy: Boolean(req.headers["x-trusted-proxy-key"]) });
  if (fiturStatus === "belum-aktif") {
    return json(res, 503, { success: false, code: "ORDER_STATUS_UNAVAILABLE", message: "Pemeriksaan status pesanan belum tersedia." });
  }
  const p = pesananPerKode.get(d.orderCode);
  if (!p || d.statusToken !== tokenUntuk(d.orderCode)) {
    return json(res, 404, { success: false, code: "ORDER_NOT_FOUND", message: "Pesanan tidak ditemukan." });
  }
  const order = { orderCode: d.orderCode, status: p.status, ticketCount: p.order.ticketCount };
  if (p.status === "pending" || p.status === "expired") order.paymentExpiresAt = p.order.paymentExpiresAt;
  if (p.status === "pending") order.paymentUrl = p.order.paymentUrl;
  return json(res, 200, { success: true, order });
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    if (url.pathname === "/__mode") {
      const m = url.searchParams.get("m") || "sukses";
      if (!MODE[m]) return json(res, 400, { error: "mode tidak dikenal", mode: Object.keys(MODE) });
      mode = m;
      return json(res, 200, { mode, arti: MODE[m] });
    }
    if (url.pathname === "/__status") {
      const kode = url.searchParams.get("kode");
      const st = url.searchParams.get("st");
      if (kode && st && pesananPerKode.has(kode)) pesananPerKode.get(kode).status = st;
      if (url.searchParams.get("fitur")) fiturStatus = url.searchParams.get("fitur");
      return json(res, 200, { fiturStatus, pesanan: [...pesananPerKode].map(([k, v]) => [k, v.status]) });
    }
    if (url.pathname === "/__tambahan") {
      tambahanAktif = url.searchParams.get("on") !== "0";
      return json(res, 200, { tambahanAktif });
    }
    if (url.pathname === "/__namabib") {
      namaBibAktif = url.searchParams.get("on") !== "0";
      return json(res, 200, { namaBibAktif });
    }
    if (url.pathname === "/__log") return json(res, 200, { mode, fiturStatus, namaBibAktif, log, jumlahPesanan: pesananPerKode.size });
    if (req.method === "GET" && url.pathname === "/api/public/events/smadarun") {
      const form_schema = [...KOLOM_INTI, ...(namaBibAktif ? [KOLOM_NAMA_BIB] : []), ...(tambahanAktif ? KOLOM_TAMBAHAN : [])];
      return json(res, 200, { ...LIVE, data: { ...LIVE.data, form_schema } });
    }
    if (req.method === "POST" && url.pathname === "/api/participants/register") return void daftar(req, res);
    if (req.method === "POST" && url.pathname === "/api/public/orders/status") return void statusPesanan(req, res);
    json(res, 404, { success: false });
  })
  .listen(PORT, "127.0.0.1", () => console.log(`mock core kembarin-v2 di http://127.0.0.1:${PORT} — mode: ${Object.keys(MODE).join(", ")}`));
