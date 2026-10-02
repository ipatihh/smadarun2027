import { describe, expect, it } from "vitest";
import {
  klasifikasiPenolakanCore,
  PESAN_BELUM_PASTI,
  PESAN_GATEWAY_GAGAL,
  PESAN_SESI_DIPERBARUI,
  tafsirkanResponsDaftar,
  verifikasiSuksesCore,
} from "@/lib/kontrakPendaftaran";

const ORIGIN = "https://www.smadarun.id";
const JSON_CT = "application/json; charset=utf-8";

describe("verifikasiSuksesCore — kontrak sukses core yang terverifikasi", () => {
  const sukses = {
    success: true,
    message: "Pesanan ORD-ABC123 berhasil dibuat. Silakan selesaikan pembayaran.",
    status: "pending",
    orderId: 42,
    orderCode: "ORD-ABC123",
    ticketCount: 2,
    participantIds: [1, 2],
    paymentUrl: "https://app.sandbox.midtrans.com/snap/v4/redirection/abc",
    paymentExpiresAt: "2026-10-02T10:00:00.000Z",
    token: "rahasia-token-gateway",
    paymentGateway: "midtrans",
  };

  it("meneruskan hanya field allowlist (token/participantIds/orderId tidak bocor)", () => {
    const hasil = verifikasiSuksesCore(sukses);
    expect(hasil).toEqual({
      jenis: "berhasil",
      order: {
        kode: "ORD-ABC123",
        status: "pending",
        paymentUrl: sukses.paymentUrl,
        paymentExpiresAt: sukses.paymentExpiresAt,
        ticketCount: 2,
      },
    });
    expect(JSON.stringify(hasil)).not.toContain("rahasia-token-gateway");
  });

  it("respons {} / success bukan true / tanpa kode pesanan = rusak", () => {
    expect(verifikasiSuksesCore({})).toEqual({ jenis: "rusak" });
    expect(verifikasiSuksesCore(null)).toEqual({ jenis: "rusak" });
    expect(verifikasiSuksesCore({ ...sukses, success: "true" })).toEqual({ jenis: "rusak" });
    expect(verifikasiSuksesCore({ ...sukses, orderCode: undefined })).toEqual({ jenis: "rusak" });
    expect(verifikasiSuksesCore({ ...sukses, orderCode: "<script>" })).toEqual({ jenis: "rusak" });
    expect(verifikasiSuksesCore({ ...sukses, status: "cancelled" })).toEqual({ jenis: "rusak" });
    expect(verifikasiSuksesCore({ ...sukses, orderId: "42" })).toEqual({ jenis: "rusak" });
  });

  it("pending tanpa tautan / tautan domain asing tetap membawa kode pesanan", () => {
    expect(verifikasiSuksesCore({ ...sukses, paymentUrl: undefined })).toEqual({ jenis: "tanpa-tautan", kode: "ORD-ABC123" });
    expect(verifikasiSuksesCore({ ...sukses, paymentUrl: "https://midtrans.com.penipu.example/bayar" })).toEqual({
      jenis: "tautan-ditolak",
      kode: "ORD-ABC123",
    });
    expect(verifikasiSuksesCore({ ...sukses, paymentUrl: "http://app.midtrans.com/x" })).toEqual({
      jenis: "tautan-ditolak",
      kode: "ORD-ABC123",
    });
  });

  it("pesanan yang sudah lunas (jalur idempotensi) diterima tanpa tautan", () => {
    expect(verifikasiSuksesCore({ ...sukses, status: "paid", paymentUrl: undefined })).toEqual({
      jenis: "berhasil",
      order: { kode: "ORD-ABC123", status: "paid", ticketCount: 2 },
    });
  });
});

describe("klasifikasiPenolakanCore — ditolak vs belum pasti", () => {
  it("validasi 400/409 = ditolak, pesan core diteruskan bila aman", () => {
    expect(
      klasifikasiPenolakanCore(409, JSON.stringify({ success: false, code: "REGISTRATION_VALIDATION_FAILED", message: "NIK sudah terdaftar pada event ini." }))
    ).toEqual({ outcome: "rejected", code: "REGISTRATION_VALIDATION_FAILED", message: "NIK sudah terdaftar pada event ini." });
  });

  it("pesan berbau error internal tidak diteruskan", () => {
    const hasil = klasifikasiPenolakanCore(400, JSON.stringify({ message: "Error: ER_DUP_ENTRY at Pool.query (/var/task/x.js)" }));
    expect(hasil.outcome).toBe("rejected");
    expect(hasil.message).not.toContain("/var/");
  });

  it("gateway gagal dibuat = ditolak dengan pesan netral (tanpa mengklaim 'belum tersimpan')", () => {
    const hasil = klasifikasiPenolakanCore(400, JSON.stringify({ code: "PAYMENT_GATEWAY_CREATION_FAILED", message: "Midtrans server key salah -> cek dasbor" }));
    expect(hasil).toEqual({ outcome: "rejected", code: "PAYMENT_GATEWAY_CREATION_FAILED", message: PESAN_GATEWAY_GAGAL });
    expect(hasil.message).not.toMatch(/belum tersimpan|dibatalkan/i);
  });

  it("rekonsiliasi gateway dan semua 5xx = belum pasti", () => {
    expect(
      klasifikasiPenolakanCore(400, JSON.stringify({ code: "PAYMENT_GATEWAY_RECONCILIATION_REQUIRED", message: "Jangan membuat pesanan baru; hubungi panitia dengan kode ORD-1." })).outcome
    ).toBe("unknown");
    expect(klasifikasiPenolakanCore(500, JSON.stringify({ code: "REGISTRATION_INTERNAL_ERROR" })).outcome).toBe("unknown");
    expect(klasifikasiPenolakanCore(502, "<html>Bad gateway</html>")).toMatchObject({ outcome: "unknown", message: PESAN_BELUM_PASTI });
  });

  it("rate limit & proteksi tidak tersedia = ditolak (core menolak sebelum membaca body)", () => {
    expect(klasifikasiPenolakanCore(429, JSON.stringify({ code: "REGISTRATION_RATE_LIMITED", message: "Coba lagi dalam 30 detik." })).outcome).toBe("rejected");
    expect(klasifikasiPenolakanCore(503, JSON.stringify({ code: "REGISTRATION_PROTECTION_UNAVAILABLE" })).outcome).toBe("rejected");
  });
});

describe("tafsirkanResponsDaftar — browser tidak pernah menganggap respons rusak sebagai sukses", () => {
  const bayar = {
    success: true,
    outcome: "created",
    order: { kode: "ORD-ABC123", status: "pending", paymentUrl: "https://app.midtrans.com/snap/v4/redirection/abc" },
  };

  it("sukses lengkap = arahkan ke pembayaran", () => {
    expect(tafsirkanResponsDaftar(200, JSON_CT, JSON.stringify(bayar), ORIGIN)).toEqual({
      jenis: "bayar",
      url: bayar.order.paymentUrl,
      kode: "ORD-ABC123",
    });
  });

  it("regresi audit: respons {} 200 = belum pasti, bukan 'Pendaftaran Berhasil'", () => {
    expect(tafsirkanResponsDaftar(200, JSON_CT, "{}", ORIGIN).jenis).toBe("belum-pasti");
    expect(tafsirkanResponsDaftar(200, JSON_CT, JSON.stringify({ success: true }), ORIGIN).jenis).toBe("belum-pasti");
  });

  it("HTML / bukan JSON (mis. halaman 504 platform) = belum pasti", () => {
    expect(tafsirkanResponsDaftar(504, "text/html", "<html>timeout</html>", ORIGIN)).toEqual({
      jenis: "belum-pasti",
      pesan: PESAN_BELUM_PASTI,
    });
  });

  it("tautan bayar domain asing = belum pasti dengan kode pesanan, tidak dialihkan", () => {
    const hasil = tafsirkanResponsDaftar(
      200,
      JSON_CT,
      JSON.stringify({ ...bayar, order: { ...bayar.order, paymentUrl: "https://evil.example/bayar" } }),
      ORIGIN
    );
    expect(hasil).toMatchObject({ jenis: "belum-pasti", kode: "ORD-ABC123" });
    expect((hasil as { pesan: string }).pesan).not.toMatch(/dibatalkan/i);
  });

  it("ditolak tetap ditolak; belum pasti membawa kode pesanan & rujukan", () => {
    expect(
      tafsirkanResponsDaftar(409, JSON_CT, JSON.stringify({ success: false, outcome: "rejected", code: "X_Y", message: "NIK sudah terdaftar." }), ORIGIN)
    ).toEqual({ jenis: "ditolak", pesan: "NIK sudah terdaftar.", kode: undefined, ulangSesi: false, ref: undefined });
    expect(
      tafsirkanResponsDaftar(
        502,
        JSON_CT,
        JSON.stringify({ success: false, outcome: "unknown", code: "PAYMENT_LINK_MISSING", message: "Pesanan ORD-1 sudah tercatat.", orderCode: "ORD-1", ref: "abc-123" }),
        ORIGIN
      )
    ).toEqual({ jenis: "belum-pasti", pesan: "Pesanan ORD-1 sudah tercatat.", kode: "ORD-1", ref: "abc-123" });
  });

  it("'rejected' dengan status 2xx dianggap tidak konsisten = belum pasti", () => {
    expect(
      tafsirkanResponsDaftar(200, JSON_CT, JSON.stringify({ success: false, outcome: "rejected", message: "x" }), ORIGIN).jenis
    ).toBe("belum-pasti");
  });
});

// ─── Kontrak partner core (kembarin-v2 docs/PARTNER_INTEGRATION.md §6–§7) ────────

const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_AbCde"; // 43 karakter base64url sintetis
const core = (status: number, body: Record<string, unknown>) => klasifikasiPenolakanCore(status, JSON.stringify(body));

describe("statusToken di respons sukses", () => {
  const sukses = {
    success: true,
    status: "pending",
    orderId: 7,
    orderCode: "ORD-XYZ123",
    paymentUrl: "https://app.midtrans.com/snap/v4/redirection/x",
  };

  it("token berpola sah ikut diteruskan; token salah bentuk diabaikan tanpa menggagalkan pesanan", () => {
    expect(TOKEN).toHaveLength(43);
    expect(verifikasiSuksesCore({ ...sukses, statusToken: TOKEN })).toMatchObject({ jenis: "berhasil", order: { statusToken: TOKEN } });
    const salah = verifikasiSuksesCore({ ...sukses, statusToken: "pendek" });
    expect(salah.jenis).toBe("berhasil");
    expect((salah as { order: object }).order).not.toHaveProperty("statusToken", "pendek");
    expect(verifikasiSuksesCore({ ...sukses, status: "paid", statusToken: TOKEN })).toMatchObject({
      order: { status: "paid", statusToken: TOKEN },
    });
  });

  it("browser menerima token bersama kode pesanan", () => {
    const body = { success: true, outcome: "created", order: { kode: "ORD-XYZ123", status: "pending", paymentUrl: sukses.paymentUrl, statusToken: TOKEN } };
    expect(tafsirkanResponsDaftar(200, JSON_CT, JSON.stringify(body), ORIGIN)).toEqual({
      jenis: "bayar",
      url: sukses.paymentUrl,
      kode: "ORD-XYZ123",
      statusToken: TOKEN,
    });
  });
});

describe("kode error baru dari core", () => {
  it("REGISTRATION_ORDER_PROCESSING (503) = belum pasti, membawa kode pesanan & detik tunggu", () => {
    const hasil = core(503, { success: false, code: "REGISTRATION_ORDER_PROCESSING", message: "Invoice pembayaran untuk pesanan ORD-1 sedang diproses.", orderCode: "ORD-1", retryAfterSeconds: 5, retryable: true });
    expect(hasil).toMatchObject({ outcome: "unknown", code: "REGISTRATION_ORDER_PROCESSING", orderCode: "ORD-1", retryAfterSeconds: 5 });
    expect(hasil.message).toContain("ORD-1");
    expect(hasil.message).toMatch(/tanpa mengubah isian/);
    expect(hasil.message).not.toMatch(/gagal|dibatalkan/i);
  });

  it("REGISTRATION_IDENTITY_PENDING_ORDER (409) = ditolak, pesan core diteruskan + kode pesanan + batas bayar", () => {
    const message = "Nomor identitas ini sudah ada di pesanan ORD-2 yang menunggu pembayaran hingga 2 Okt 2026 11.00 WIB. Bayar lewat tautan di email pemesan, atau daftar ulang setelah itu.";
    expect(message.length).toBeLessThanOrEqual(200);
    expect(core(409, { code: "REGISTRATION_IDENTITY_PENDING_ORDER", message, orderCode: "ORD-2", paymentExpiresAt: "2026-10-02T04:00:00.000Z" })).toEqual({
      outcome: "rejected",
      code: "REGISTRATION_IDENTITY_PENDING_ORDER",
      orderCode: "ORD-2",
      paymentExpiresAt: "2026-10-02T04:00:00.000Z",
      message,
    });
  });

  it("REGISTRATION_IDEMPOTENCY_MISMATCH = ditolak, sesi diulang, dicatat sebagai bug; saran 'muat ulang' core tidak diteruskan", () => {
    const hasil = core(409, { code: "REGISTRATION_IDEMPOTENCY_MISMATCH", message: "Halaman ini sudah membuat pesanan ORD-3 dengan isi berbeda. Muat ulang halaman lalu isi kembali untuk membuat pesanan baru.", orderCode: "ORD-3" });
    expect(hasil).toMatchObject({ outcome: "rejected", orderCode: "ORD-3", ulangSesi: true, bugPartner: true });
    expect(hasil.message).not.toMatch(/muat ulang/i);
    expect(hasil.message).toMatch(/Isian Anda tetap ada/);
  });

  it("REGISTRATION_SESSION_INVALID (400) = ditolak, sesi diulang, dicatat sebagai bug", () => {
    expect(core(400, { code: "REGISTRATION_SESSION_INVALID", message: "Kode sesi pendaftaran tidak valid. Muat ulang halaman lalu coba lagi." })).toEqual({
      outcome: "rejected",
      code: "REGISTRATION_SESSION_INVALID",
      ulangSesi: true,
      bugPartner: true,
      message: PESAN_SESI_DIPERBARUI,
    });
  });

  it("PAYMENT_GATEWAY_RECONCILIATION_REQUIRED memakai field orderCode, bukan mengurai kalimat", () => {
    expect(core(400, { code: "PAYMENT_GATEWAY_RECONCILIATION_REQUIRED", message: "x".repeat(250), orderCode: "ORD-4" })).toMatchObject({
      outcome: "unknown",
      orderCode: "ORD-4",
      message: expect.stringContaining("ORD-4"),
    });
  });

  it("penolakan konfigurasi event kini 400 REGISTRATION_VALIDATION_FAILED = ditolak", () => {
    expect(core(400, { code: "REGISTRATION_VALIDATION_FAILED", message: "Harga tiket kategori ini belum disetel panitia." })).toEqual({
      outcome: "rejected",
      code: "REGISTRATION_VALIDATION_FAILED",
      message: "Harga tiket kategori ini belum disetel panitia.",
    });
  });

  it("orderCode berbahaya / format salah dibuang", () => {
    expect(core(409, { code: "REGISTRATION_IDENTITY_PENDING_ORDER", orderCode: "<b>x</b>" }).orderCode).toBeUndefined();
  });

  it("browser: ditolak membawa kode pesanan dan instruksi mengulang sesi", () => {
    const body = { success: false, outcome: "rejected", code: "REGISTRATION_IDEMPOTENCY_MISMATCH", message: "Pesanan ORD-3 sudah tercatat.", orderCode: "ORD-3", ulangSesi: true };
    expect(tafsirkanResponsDaftar(409, JSON_CT, JSON.stringify(body), ORIGIN)).toEqual({
      jenis: "ditolak",
      pesan: "Pesanan ORD-3 sudah tercatat.",
      kode: "ORD-3",
      ulangSesi: true,
      ref: undefined,
    });
  });
});
