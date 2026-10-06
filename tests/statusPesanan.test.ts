import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BATAS_PERIKSA_ULANG,
  bacaPesananTerakhir,
  type HasilStatus,
  kodeDariKueri,
  KUNCI_SESI_PESANAN,
  lupakanPesananTerakhir,
  perluPeriksaUlang,
  pilihPesananTampil,
  simpanPesananTerakhir,
  tafsirkanResponsStatus,
  terjemahkanStatusCore,
  URL_KEMBALI_PEMBAYARAN,
  urlPaymentReturn,
} from "@/lib/statusPesanan";
import { existsSync } from "node:fs";
import { POST } from "@/app/api/status-pesanan/route";

// Data sintetis. Token 43 karakter base64url.
const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_AbCde";
const KODE = "ORD-ABC123";
const ORIGIN = "https://www.smadarun.id";
const JSON_CT = "application/json";
const BAYAR = "https://app.midtrans.com/snap/v4/redirection/abc";

class StorageTiruan implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
}

describe("terjemahkanStatusCore — allowlist & pemetaan kode core", () => {
  const sukses = (order: Record<string, unknown>) => JSON.stringify({ success: true, order: { orderCode: KODE, ticketCount: 2, ...order } });

  it("pending: tautan bayar & batas diteruskan; tautan domain asing dibuang", () => {
    expect(terjemahkanStatusCore(200, sukses({ status: "pending", paymentUrl: BAYAR, paymentExpiresAt: "2026-10-02T04:00:00.000Z" }))).toEqual({
      status: 200,
      body: { success: true, order: { status: "pending", ticketCount: 2, paymentUrl: BAYAR, paymentExpiresAt: "2026-10-02T04:00:00.000Z" } },
    });
    const asing = terjemahkanStatusCore(200, sukses({ status: "pending", paymentUrl: "https://evil.example/bayar" }));
    expect(asing.body).toEqual({ success: true, order: { status: "pending", ticketCount: 2 } });
  });

  it("paid / expired / cancelled diterima; tautan bayar hanya untuk pending", () => {
    for (const status of ["paid", "expired", "cancelled"]) {
      const hasil = terjemahkanStatusCore(200, sukses({ status, paymentUrl: BAYAR }));
      expect(hasil).toMatchObject({ status: 200, body: { success: true, order: { status } } });
      expect(JSON.stringify(hasil)).not.toContain(BAYAR);
    }
  });

  it("field di luar allowlist (mis. data pribadi) tidak diteruskan", () => {
    const hasil = terjemahkanStatusCore(200, sukses({ status: "paid", buyerEmail: "pemesan@contoh.test", nik: "9999000000000001" }));
    expect(JSON.stringify(hasil)).not.toMatch(/contoh\.test|9999/);
  });

  it("404 = tidak ada; 503 ORDER_STATUS_UNAVAILABLE = belum aktif; 429 = dibatasi; lainnya = gangguan", () => {
    expect(terjemahkanStatusCore(404, JSON.stringify({ code: "ORDER_NOT_FOUND" })).body).toMatchObject({ hasil: "tidak-ada" });
    expect(terjemahkanStatusCore(503, JSON.stringify({ code: "ORDER_STATUS_UNAVAILABLE" })).body).toMatchObject({ hasil: "belum-aktif" });
    expect(terjemahkanStatusCore(503, JSON.stringify({ code: "ORDER_STATUS_PROTECTION_UNAVAILABLE" })).body).toMatchObject({ hasil: "gangguan" });
    expect(terjemahkanStatusCore(429, "{}").body).toMatchObject({ hasil: "dibatasi" });
    expect(terjemahkanStatusCore(500, "<html>").body).toMatchObject({ hasil: "gangguan" });
    expect(terjemahkanStatusCore(200, "{}").body).toMatchObject({ hasil: "gangguan" });
    expect(terjemahkanStatusCore(200, sukses({ status: "lunas-palsu" })).body).toMatchObject({ hasil: "gangguan" });
  });
});

describe("tafsirkanResponsStatus — browser", () => {
  it("respons sah = ada; tautan bayar diperiksa ulang", () => {
    const body = JSON.stringify({ success: true, order: { status: "pending", paymentUrl: BAYAR } });
    expect(tafsirkanResponsStatus(200, JSON_CT, body, ORIGIN)).toEqual({ jenis: "ada", order: { status: "pending", paymentUrl: BAYAR } });
  });

  it("bukan JSON / bentuk aneh = gangguan, bukan 'tidak ada'", () => {
    expect(tafsirkanResponsStatus(502, "text/html", "<html>", ORIGIN)).toEqual({ jenis: "gangguan" });
    expect(tafsirkanResponsStatus(200, JSON_CT, JSON.stringify({ success: true }), ORIGIN)).toEqual({ jenis: "gangguan" });
    expect(tafsirkanResponsStatus(404, JSON_CT, JSON.stringify({ success: false, hasil: "tidak-ada" }), ORIGIN)).toEqual({ jenis: "tidak-ada" });
  });

  it("tautan cadangan kembar.in memakai kode pesanan saja (tanpa token)", () => {
    expect(urlPaymentReturn(KODE)).toBe("https://kembar.in/events/smadarun/payment-return?order=ORD-ABC123");
  });
});

describe("kembali dari gateway (?order=)", () => {
  it("tujuan kembali: https di www (smadarun.id dialihkan ke www), ke halaman status yang memang ada", () => {
    const url = new URL(URL_KEMBALI_PEMBAYARAN);
    expect(url.protocol).toBe("https:");
    expect(url.host).toBe("www.smadarun.id");
    expect(url.pathname).toBe("/daftar/status");
    expect(url.search + url.hash).toBe("");
    expect(existsSync("src/app/daftar/status/page.tsx")).toBe(true);
  });

  it("kode dari ?order= divalidasi; result tidak pernah dibaca", () => {
    expect(kodeDariKueri("?order=KBR-MG8X2K1A-3F9A2B&result=success")).toBe("KBR-MG8X2K1A-3F9A2B");
    // Gateway boleh menambah parameternya sendiri di belakang.
    expect(kodeDariKueri("?order=KBR-A1&result=success&order_id=KBR-A1&transaction_status=pending")).toBe("KBR-A1");
    expect(kodeDariKueri("?result=success")).toBeNull();
    expect(kodeDariKueri("")).toBeNull();
    expect(kodeDariKueri("?order=%3Cscript%3E")).toBeNull();
    expect(kodeDariKueri(`?order=${"A".repeat(65)}`)).toBeNull();
  });

  it("kode sama dengan pesanan tersimpan = pesanan itu beserta tokennya", () => {
    const tersimpan = { kode: KODE, statusToken: TOKEN };
    expect(pilihPesananTampil(tersimpan, KODE)).toEqual({ pesanan: tersimpan, dariPenyimpanan: true, dariGateway: true });
    expect(pilihPesananTampil(tersimpan, null)).toEqual({ pesanan: tersimpan, dariPenyimpanan: true, dariGateway: false });
    expect(pilihPesananTampil(null, null)).toBeNull();
  });

  it("kode lain (tab/perangkat lain) tampil tanpa token: tidak bisa diperiksa, tidak bisa dilupakan", () => {
    const tampil = pilihPesananTampil({ kode: "ORD-LAIN", statusToken: TOKEN }, KODE);
    expect(tampil).toEqual({ pesanan: { kode: KODE }, dariPenyimpanan: false, dariGateway: true });
    expect(JSON.stringify(tampil)).not.toContain(TOKEN);
    expect(pilihPesananTampil(null, KODE)).toEqual({ pesanan: { kode: KODE }, dariPenyimpanan: false, dariGateway: true });
  });

  it("periksa ulang otomatis hanya untuk pending setelah kembali dari gateway, dan berbatas", () => {
    const pending: HasilStatus = { jenis: "ada", order: { status: "pending" } };
    expect(perluPeriksaUlang(pending, true, 0)).toBe(true);
    expect(perluPeriksaUlang(pending, true, BATAS_PERIKSA_ULANG - 1)).toBe(true);
    expect(perluPeriksaUlang(pending, true, BATAS_PERIKSA_ULANG)).toBe(false);
    expect(perluPeriksaUlang(pending, false, 0)).toBe(false);
    expect(perluPeriksaUlang({ jenis: "ada", order: { status: "paid" } }, true, 0)).toBe(false);
    expect(perluPeriksaUlang({ jenis: "gangguan" }, true, 0)).toBe(false);
    expect(perluPeriksaUlang(null, true, 0)).toBe(false);
    // Awal + ulangan tetap di bawah batas core 20/menit per pesanan.
    expect(1 + BATAS_PERIKSA_ULANG).toBeLessThanOrEqual(20);
  });
});

describe("penyimpanan pesanan terakhir (sessionStorage)", () => {
  it("menyimpan kode + token; kode tanpa token tidak menghapus token kode yang sama", () => {
    const store = new StorageTiruan();
    simpanPesananTerakhir({ kode: KODE, statusToken: TOKEN }, store);
    expect(bacaPesananTerakhir(store)).toEqual({ kode: KODE, statusToken: TOKEN });
    simpanPesananTerakhir({ kode: KODE }, store);
    expect(bacaPesananTerakhir(store)).toEqual({ kode: KODE, statusToken: TOKEN });
    simpanPesananTerakhir({ kode: "ORD-LAIN" }, store);
    expect(bacaPesananTerakhir(store)).toEqual({ kode: "ORD-LAIN", statusToken: undefined });
    lupakanPesananTerakhir(store);
    expect(bacaPesananTerakhir(store)).toBeNull();
  });

  it("isi rusak atau token salah bentuk tidak dipakai; tidak ada data pribadi yang disimpan", () => {
    const store = new StorageTiruan();
    store.setItem(KUNCI_SESI_PESANAN, "{bukan json");
    expect(bacaPesananTerakhir(store)).toBeNull();
    store.setItem(KUNCI_SESI_PESANAN, JSON.stringify({ kode: KODE, statusToken: "pendek" }));
    expect(bacaPesananTerakhir(store)).toEqual({ kode: KODE, statusToken: undefined });
    simpanPesananTerakhir({ kode: KODE, statusToken: TOKEN }, store);
    expect(Object.keys(JSON.parse(store.getItem(KUNCI_SESI_PESANAN)!))).toEqual(["kode", "statusToken"]);
  });

  it("penyimpanan diblokir tidak membuat error", () => {
    expect(() => simpanPesananTerakhir({ kode: KODE }, null)).not.toThrow();
    expect(bacaPesananTerakhir(null)).toBeNull();
  });
});

describe("api/status-pesanan", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let logError: ReturnType<typeof vi.spyOn>;
  let nomorIp = 0;

  function permintaan(body: unknown, opsi: { origin?: string; contentType?: string; ip?: string } = {}) {
    return new NextRequest("http://localhost:3000/api/status-pesanan", {
      method: "POST",
      headers: {
        "content-type": opsi.contentType ?? "application/json",
        host: "localhost:3000",
        origin: opsi.origin ?? "http://localhost:3000",
        "x-forwarded-for": opsi.ip ?? `10.1.0.${++nomorIp}`,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  }

  beforeEach(() => {
    process.env.KEMBAR_IN_API_URL = "https://core.contoh.test/api/participants/register";
    process.env.TRUSTED_PROXY_API_KEY = "kunci-partner-sintetis-0123456789";
    fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ success: true, order: { orderCode: KODE, status: "paid", ticketCount: 1 } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    logError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete process.env.KEMBAR_IN_API_URL;
    delete process.env.TRUSTED_PROXY_API_KEY;
    // Token status adalah kunci akses: tidak boleh pernah masuk log.
    expect(JSON.stringify(logError.mock.calls)).not.toContain(TOKEN);
  });

  it("meneruskan ke endpoint status core (satu origin dengan KEMBAR_IN_API_URL) dengan header trusted-proxy", async () => {
    const res = await POST(permintaan({ orderCode: KODE, statusToken: TOKEN }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, order: { status: "paid", ticketCount: 1 } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://core.contoh.test/api/public/orders/status");
    expect(JSON.parse(init.body)).toEqual({ orderCode: KODE, statusToken: TOKEN });
    expect(init.headers["X-Trusted-Proxy-Key"]).toBe("kunci-partner-sintetis-0123456789");
    expect(init.headers["X-Forwarded-Client-Ip"]).toBeTruthy();
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("kode/token salah bentuk, bukan JSON, atau Origin asing ditolak tanpa menghubungi core", async () => {
    expect((await POST(permintaan({ orderCode: KODE, statusToken: "pendek" }))).status).toBe(400);
    expect((await POST(permintaan({ orderCode: "<x>", statusToken: TOKEN }))).status).toBe(400);
    expect((await POST(permintaan("null"))).status).toBe(400);
    expect((await POST(permintaan({ orderCode: KODE, statusToken: TOKEN }, { contentType: "text/plain" }))).status).toBe(400);
    expect((await POST(permintaan({ orderCode: KODE, statusToken: TOKEN }, { origin: "https://situs-lain.example" }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("404 core = 404 tidak ada; 503 belum aktif = 503", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: false, code: "ORDER_NOT_FOUND" }), { status: 404 }));
    const tidakAda = await POST(permintaan({ orderCode: KODE, statusToken: TOKEN }));
    expect(tidakAda.status).toBe(404);
    expect(await tidakAda.json()).toMatchObject({ hasil: "tidak-ada" });

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: false, code: "ORDER_STATUS_UNAVAILABLE" }), { status: 503 }));
    const belum = await POST(permintaan({ orderCode: KODE, statusToken: TOKEN }));
    expect(belum.status).toBe(503);
    expect(await belum.json()).toMatchObject({ hasil: "belum-aktif" });
  });

  it("core tidak merespons 10 detik = 504 gangguan, tanpa pengulangan", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal!.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        })
    );
    const hasil = POST(permintaan({ orderCode: KODE, statusToken: TOKEN }));
    await vi.advanceTimersByTimeAsync(10_000);
    const res = await hasil;
    expect(res.status).toBe(504);
    expect(await res.json()).toMatchObject({ hasil: "gangguan" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("lebih dari 30 pemeriksaan per menit dari satu IP = 429", async () => {
    const ip = "198.51.100.77";
    for (let i = 0; i < 30; i++) expect((await POST(permintaan({ orderCode: KODE, statusToken: TOKEN }, { ip }))).status).toBe(200);
    const res = await POST(permintaan({ orderCode: KODE, statusToken: TOKEN }, { ip }));
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBeTruthy();
  });
});
