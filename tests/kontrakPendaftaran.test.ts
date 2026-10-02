import { describe, expect, it } from "vitest";
import {
  klasifikasiPenolakanCore,
  PESAN_BELUM_PASTI,
  PESAN_GATEWAY_GAGAL,
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
    ).toEqual({ jenis: "ditolak", pesan: "NIK sudah terdaftar.", ref: undefined });
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
