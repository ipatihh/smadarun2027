import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { LiveEventData } from "@/lib/kembarinEvents";

// Data live & core di-mock: uji ini tidak pernah menghubungi kembar.in.
vi.mock("@/lib/kembarinEvents", () => ({ getLiveEventData: vi.fn() }));
import { getLiveEventData } from "@/lib/kembarinEvents";
import { POST } from "@/app/api/daftar/route";

const LIVE: LiveEventData = {
  isOpen: true,
  ticketTypes: [{ categoryKey: "5 KM Reguler", price: 180000, id: 7 }],
  eventDate: null,
  location: null,
  timeline: null,
  adminFee: 5000,
  multiTicketEnabled: true,
  maxTicketsPerOrder: 5,
  wilayahDropdown: true,
  opensAt: null,
  namaBib: null,
  kolomTambahan: [],
} as LiveEventData;

// Data sintetis.
const PII = {
  nama: "Audit Pemesan",
  email: "pemesan@contoh.test",
  wa: "081200000001",
  nik: "3518000000000001",
};
const SESSION = "1b4e28ba-2fa1-11d2-883f-0016d3cca427";

function payloadValid(isi: Record<string, unknown> = {}) {
  return {
    eventCode: "smadarun",
    sessionId: SESSION,
    buyer: { nama: PII.nama, email: PII.email, whatsapp: PII.wa },
    participants: [
      {
        nama: PII.nama,
        email: PII.email,
        whatsapp: PII.wa,
        nik: PII.nik,
        jenisIdentitas: "nik",
        gender: "Laki-laki",
        provCode: "35",
        kotaCode: "35.18",
        kota: "",
        kategori: "5 KM Reguler",
        size: "M",
      },
    ],
    health_declaration: true,
    privacy_consent: true,
    subtotal: 180000,
    total_amount: 185000,
    ...isi,
  };
}

let nomorIp = 0;
function permintaan(
  body: unknown,
  opsi: { ip?: string; contentType?: string; origin?: string | null; raw?: string; headers?: Record<string, string> } = {}
) {
  const headers: Record<string, string> = {
    "content-type": opsi.contentType ?? "application/json",
    host: "localhost:3000",
    "x-forwarded-for": opsi.ip ?? `10.0.0.${++nomorIp}`,
    ...opsi.headers,
  };
  if (opsi.origin !== null) headers.origin = opsi.origin ?? "http://localhost:3000";
  return new NextRequest("http://localhost:3000/api/daftar", {
    method: "POST",
    headers,
    body: opsi.raw ?? JSON.stringify(body),
  });
}

function responsCore(body: unknown, status = 200) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const SUKSES_CORE = {
  success: true,
  message: "Pesanan ORD-ABC123 berhasil dibuat.",
  status: "pending",
  orderId: 42,
  orderCode: "ORD-ABC123",
  ticketCount: 1,
  participantIds: [99],
  paymentUrl: "https://app.sandbox.midtrans.com/snap/v4/redirection/abc",
  token: "token-rahasia",
  paymentGateway: "midtrans",
};

let fetchMock: ReturnType<typeof vi.fn>;
let logError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.mocked(getLiveEventData).mockResolvedValue(LIVE);
  fetchMock = vi.fn(async () => responsCore(SUKSES_CORE));
  vi.stubGlobal("fetch", fetchMock);
  logError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  // Tidak satu pun log boleh memuat data pribadi peserta.
  const semuaLog = JSON.stringify(logError.mock.calls);
  for (const nilai of Object.values(PII)) expect(semuaLog).not.toContain(nilai);
});

describe("bentuk permintaan", () => {
  it("body JSON null / array / angka = 400, bukan 500", async () => {
    for (const raw of ["null", "[]", "42", '"teks"']) {
      const res = await POST(permintaan(null, { raw }));
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ success: false, outcome: "rejected" });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("JSON rusak = 400", async () => {
    const res = await POST(permintaan(null, { raw: "{bukan json" }));
    expect(res.status).toBe(400);
  });

  it("Content-Type selain JSON = 415", async () => {
    const res = await POST(permintaan(payloadValid(), { contentType: "text/plain" }));
    expect(res.status).toBe(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Origin situs lain / sec-fetch-site cross-site = 403; tanpa Origin tetap diterima", async () => {
    expect((await POST(permintaan(payloadValid(), { origin: "https://situs-lain.example" }))).status).toBe(403);
    expect((await POST(permintaan(payloadValid(), { headers: { "sec-fetch-site": "cross-site" } }))).status).toBe(403);
    expect((await POST(permintaan(payloadValid(), { origin: null }))).status).toBe(200);
  });

  it("body melebihi batas = 413 (lewat Content-Length maupun isi sebenarnya)", async () => {
    const besar = JSON.stringify(payloadValid({ isian: "x".repeat(70 * 1024) }));
    expect((await POST(permintaan(null, { raw: besar }))).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("email melebihi 254 karakter ditolak", async () => {
    const email = `${"a".repeat(250)}@contoh.test`;
    const res = await POST(permintaan(payloadValid({ buyer: { nama: PII.nama, email, whatsapp: PII.wa } })));
    expect(res.status).toBe(400);
  });

  it("sessionId bukan UUID ditolak; tanpa sessionId (tab lama) tetap diproses tanpa kunci idempotensi", async () => {
    expect((await POST(permintaan(payloadValid({ sessionId: "tebak-tebakan" })))).status).toBe(400);
    const res = await POST(permintaan(payloadValid({ sessionId: undefined })));
    expect(res.status).toBe(200);
    const dikirim = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(dikirim).not.toHaveProperty("sessionId");
  });
});

describe("kontrak ke core", () => {
  it("sessionId diteruskan sebagai kunci idempotensi; respons hanya berisi field allowlist", async () => {
    const res = await POST(permintaan(payloadValid()));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      success: true,
      outcome: "created",
      order: { kode: "ORD-ABC123", status: "pending", paymentUrl: SUKSES_CORE.paymentUrl, ticketCount: 1 },
    });
    expect(JSON.stringify(body)).not.toContain("token-rahasia");
    const dikirim = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(dikirim.sessionId).toBe(SESSION);
    expect(dikirim.paymentGateway).toBe("auto");
  });

  it("tujuan kembali setelah bayar selalu halaman status situs ini; nilai dari browser diabaikan", async () => {
    await POST(permintaan(payloadValid({ partnerReturnUrl: "https://evil.example/curi" })));
    const dikirim = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(dikirim.partnerReturnUrl).toBe("https://www.smadarun.id/daftar/status");
    expect(JSON.stringify(dikirim)).not.toContain("evil.example");
  });

  it("respons sukses {} dari core = 502 belum pasti (isian tidak boleh dihapus browser)", async () => {
    fetchMock.mockResolvedValueOnce(responsCore({}));
    const res = await POST(permintaan(payloadValid()));
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ success: false, outcome: "unknown", code: "CORE_MALFORMED_RESPONSE" });
  });

  it("respons 200 bukan JSON = belum pasti", async () => {
    fetchMock.mockResolvedValueOnce(new Response("<html>ok</html>", { status: 200 }));
    const res = await POST(permintaan(payloadValid()));
    expect(await res.json()).toMatchObject({ outcome: "unknown" });
  });

  it("tautan bayar domain asing = belum pasti dengan kode pesanan, tautan tidak diteruskan", async () => {
    fetchMock.mockResolvedValueOnce(responsCore({ ...SUKSES_CORE, paymentUrl: "https://midtrans.com.penipu.example/x" }));
    const res = await POST(permintaan(payloadValid()));
    const body = await res.json();
    expect(body).toMatchObject({ outcome: "unknown", code: "PAYMENT_LINK_UNTRUSTED", orderCode: "ORD-ABC123" });
    expect(JSON.stringify(body)).not.toContain("penipu");
  });

  it("core 409 = ditolak dengan pesan core; core 500 = belum pasti", async () => {
    fetchMock.mockResolvedValueOnce(
      responsCore({ success: false, code: "REGISTRATION_VALIDATION_FAILED", message: "NIK sudah terdaftar pada event ini." }, 409)
    );
    const ditolak = await POST(permintaan(payloadValid()));
    expect(ditolak.status).toBe(409);
    expect(await ditolak.json()).toMatchObject({ outcome: "rejected", message: "NIK sudah terdaftar pada event ini." });

    fetchMock.mockResolvedValueOnce(responsCore({ success: false, code: "REGISTRATION_INTERNAL_ERROR" }, 500));
    const tidakPasti = await POST(permintaan(payloadValid()));
    expect(tidakPasti.status).toBe(502);
    const body = await tidakPasti.json();
    expect(body.outcome).toBe("unknown");
    expect(body.message).not.toMatch(/belum tersimpan|dibatalkan|berhasil/i);
  });

  it("body error core yang memantulkan data pribadi tidak masuk log", async () => {
    fetchMock.mockResolvedValueOnce(
      responsCore({ success: false, message: `Peserta ${PII.nama} (${PII.email}, ${PII.nik}, ${PII.wa}) ditolak` }, 400)
    );
    await POST(permintaan(payloadValid()));
    expect(logError).toHaveBeenCalled();
    // Pemeriksaan isi log ada di afterEach.
  });
});

describe("timeout & sambungan", () => {
  it("core tidak merespons 25 detik = 504 belum pasti, tanpa percobaan ulang", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal!.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        })
    );
    const hasil = POST(permintaan(payloadValid()));
    await vi.advanceTimersByTimeAsync(25_000);
    const res = await hasil;
    expect(res.status).toBe(504);
    const body = await res.json();
    expect(body).toMatchObject({ outcome: "unknown", code: "CORE_TIMEOUT" });
    expect(body.message).not.toMatch(/belum tersimpan|dibatalkan/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("header tiba tetapi body macet: batas waktu tetap berlaku sampai body selesai dibaca", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementationOnce(async (_url: string, init: RequestInit) => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{"success":true,'));
          init.signal!.addEventListener("abort", () => controller.error(new DOMException("aborted", "AbortError")));
        },
      });
      return new Response(stream, { status: 200, headers: { "content-type": "application/json" } });
    });
    const hasil = POST(permintaan(payloadValid()));
    await vi.advanceTimersByTimeAsync(25_000);
    const res = await hasil;
    expect(res.status).toBe(504);
    expect(await res.json()).toMatchObject({ outcome: "unknown", code: "CORE_TIMEOUT" });
  });

  it("sambungan putus = 504 belum pasti", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    const res = await POST(permintaan(payloadValid()));
    expect(res.status).toBe(504);
    expect(await res.json()).toMatchObject({ outcome: "unknown", code: "CORE_UNREACHABLE" });
  });
});

describe("kunci dalam proses & rate limit", () => {
  it("NIK yang sama ditolak 409 selama request pertama masih berjalan, lalu dilepas", async () => {
    let selesaikan!: (r: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise<Response>((r) => (selesaikan = r)));
    const pertama = POST(permintaan(payloadValid()));
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const kedua = await POST(permintaan(payloadValid()));
    expect(kedua.status).toBe(409);
    expect(await kedua.json()).toMatchObject({ code: "REGISTRATION_IN_PROGRESS" });

    selesaikan(responsCore(SUKSES_CORE));
    expect((await pertama).status).toBe(200);
    expect((await POST(permintaan(payloadValid()))).status).toBe(200);
  });

  it("permintaan yang gagal validasi tidak menghabiskan jatah ke core (jaringan NAT bersama)", async () => {
    const ip = "203.0.113.7";
    for (let i = 0; i < 12; i++) {
      expect((await POST(permintaan(payloadValid({ eventCode: "salah" }), { ip }))).status).toBe(400);
    }
    expect((await POST(permintaan(payloadValid(), { ip }))).status).toBe(200);
  });

  it("lebih dari 20 permintaan valid per menit dari satu IP = 429 dengan Retry-After", async () => {
    const ip = "198.51.100.9";
    for (let i = 0; i < 20; i++) expect((await POST(permintaan(payloadValid(), { ip }))).status).toBe(200);
    const res = await POST(permintaan(payloadValid(), { ip }));
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBeTruthy();
  });
});

describe("kontrak partner core", () => {
  const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_AbCde";

  it("consent_policy_version: dikirim label yang ditampilkan; tanpa label = label pertama; label asing ditolak", async () => {
    await POST(permintaan(payloadValid({ consent_policy_version: "smadarun-2026-10" })));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).consent_policy_version).toBe("smadarun-2026-10");

    await POST(permintaan(payloadValid()));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).consent_policy_version).toBe("smadarun-2026-10");

    const res = await POST(permintaan(payloadValid({ consent_policy_version: "karangan-sendiri" })));
    expect(res.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("statusToken dari core diteruskan ke browser", async () => {
    fetchMock.mockResolvedValueOnce(responsCore({ ...SUKSES_CORE, statusToken: TOKEN }));
    const body = await (await POST(permintaan(payloadValid()))).json();
    expect(body.order.statusToken).toBe(TOKEN);
  });

  it("REGISTRATION_ORDER_PROCESSING = 503 belum pasti dengan orderCode dan Retry-After", async () => {
    fetchMock.mockResolvedValueOnce(
      responsCore({ success: false, code: "REGISTRATION_ORDER_PROCESSING", message: "x", orderCode: "ORD-ABC123", retryAfterSeconds: 4, retryable: true }, 503)
    );
    const res = await POST(permintaan(payloadValid()));
    expect(res.status).toBe(503);
    expect(res.headers.get("retry-after")).toBe("4");
    expect(await res.json()).toMatchObject({ outcome: "unknown", code: "REGISTRATION_ORDER_PROCESSING", orderCode: "ORD-ABC123", retryAfterSeconds: 4 });
  });

  it("REGISTRATION_IDENTITY_PENDING_ORDER = 409 ditolak dengan orderCode, tanpa tautan bayar", async () => {
    fetchMock.mockResolvedValueOnce(
      responsCore({ success: false, code: "REGISTRATION_IDENTITY_PENDING_ORDER", message: "Nomor identitas ini sudah ada di pesanan ORD-LAMA.", orderCode: "ORD-LAMA", paymentExpiresAt: "2026-10-02T04:00:00.000Z" }, 409)
    );
    const res = await POST(permintaan(payloadValid()));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toMatchObject({ outcome: "rejected", orderCode: "ORD-LAMA", paymentExpiresAt: "2026-10-02T04:00:00.000Z" });
    expect(body).not.toHaveProperty("ulangSesi");
  });

  it("REGISTRATION_IDEMPOTENCY_MISMATCH dicatat sebagai bug partner dan meminta browser mengulang sesi", async () => {
    fetchMock.mockResolvedValueOnce(responsCore({ success: false, code: "REGISTRATION_IDEMPOTENCY_MISMATCH", message: "x", orderCode: "ORD-ABC123" }, 409));
    const body = await (await POST(permintaan(payloadValid()))).json();
    expect(body).toMatchObject({ outcome: "rejected", ulangSesi: true, orderCode: "ORD-ABC123" });
    expect(JSON.stringify(logError.mock.calls)).toContain("partner_bug");
  });
});

describe("label versi persetujuan", () => {
  it("label yang sedang dipakai form selalu ada di daftar label yang diterima server", async () => {
    const { VERSI_PERSETUJUAN, VERSI_PERSETUJUAN_DIKENAL, VERSI_PERSETUJUAN_TANPA_LABEL } = await import("@/lib/persetujuan");
    // Kalau gagal: label baru belum ditambahkan ke VERSI_PERSETUJUAN_DIKENAL — tanpa itu
    // SEMUA pendaftaran dari form ditolak "Versi teks persetujuan tidak dikenal".
    expect(VERSI_PERSETUJUAN_DIKENAL).toContain(VERSI_PERSETUJUAN);
    expect(VERSI_PERSETUJUAN_DIKENAL).toContain(VERSI_PERSETUJUAN_TANPA_LABEL);
    for (const label of VERSI_PERSETUJUAN_DIKENAL) expect(label).toMatch(/^[A-Za-z0-9._-]{1,32}$/);
    expect(new Set(VERSI_PERSETUJUAN_DIKENAL).size).toBe(VERSI_PERSETUJUAN_DIKENAL.length);
  });
});

describe("Nama BIB dari form_schema core", () => {
  const KOLOM = { fieldName: "nama_bib", label: "Name On BIB", maxLength: 15 };
  const denganNamaBib = (namaBib: unknown) =>
    payloadValid({
      participants: [{ ...payloadValid().participants[0], namaBib }],
    });

  it("kolom dipasang: dirapikan huruf besar dan dikirim dengan kunci field core", async () => {
    vi.mocked(getLiveEventData).mockResolvedValue({ ...LIVE, namaBib: KOLOM });
    const res = await POST(permintaan(denganNamaBib("  budi  ")));
    expect(res.status).toBe(200);
    const dikirim = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(dikirim.participants[0].customFields.nama_bib).toBe("BUDI");
  });

  it("kolom dipasang tapi dikosongkan: tidak dikirim (BIB memakai nama lengkap)", async () => {
    vi.mocked(getLiveEventData).mockResolvedValue({ ...LIVE, namaBib: KOLOM });
    await POST(permintaan(denganNamaBib("")));
    const dikirim = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(dikirim.participants[0].customFields).not.toHaveProperty("nama_bib");
  });

  it("melebihi batas atau berisi emoji ditolak sebelum core dihubungi", async () => {
    vi.mocked(getLiveEventData).mockResolvedValue({ ...LIVE, namaBib: KOLOM });
    expect((await POST(permintaan(denganNamaBib("A".repeat(16))))).status).toBe(400);
    expect((await POST(permintaan(denganNamaBib("BUDI 🏃")))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("kolom tidak dipasang panitia: isian dari browser diabaikan", async () => {
    vi.mocked(getLiveEventData).mockResolvedValue({ ...LIVE, namaBib: null });
    const res = await POST(permintaan(denganNamaBib("BUDI")));
    expect(res.status).toBe(200);
    const dikirim = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(JSON.stringify(dikirim.participants[0].customFields)).not.toContain("BUDI");
  });
});

describe("kolom tambahan dari form_schema core", () => {
  const KONTAK = [
    { name: "kontak_darurat_nama", label: "Nama Kontak Darurat", type: "text" as const, required: true, options: [], placeholder: "", maxLength: 1000 },
    { name: "kontak_darurat_nomor", label: "Nomor Kontak Darurat", type: "tel" as const, required: true, options: [], placeholder: "", maxLength: 16 },
    { name: "golongan_darah", label: "Golongan Darah", type: "select" as const, required: false, options: ["A", "B", "AB", "O"], placeholder: "", maxLength: 1000 },
  ];
  const denganTambahan = (tambahan: unknown) =>
    payloadValid({ participants: [{ ...payloadValid().participants[0], tambahan }] });

  it("isian dikirim dengan kunci field core, telepon dirapikan", async () => {
    vi.mocked(getLiveEventData).mockResolvedValue({ ...LIVE, kolomTambahan: KONTAK });
    const res = await POST(
      permintaan(denganTambahan({ kontak_darurat_nama: " Ibu Uji ", kontak_darurat_nomor: "0812-0000-0009", golongan_darah: "O" }))
    );
    expect(res.status).toBe(200);
    const cf = JSON.parse(fetchMock.mock.calls[0][1].body).participants[0].customFields;
    expect(cf).toMatchObject({ kontak_darurat_nama: "Ibu Uji", kontak_darurat_nomor: "081200000009", golongan_darah: "O" });
    // Data inti tetap milik api/daftar.
    expect(cf.nik).toBe(PII.nik);
  });

  it("kolom wajib kosong, telepon salah, atau pilihan di luar daftar ditolak sebelum core", async () => {
    vi.mocked(getLiveEventData).mockResolvedValue({ ...LIVE, kolomTambahan: KONTAK });
    expect((await POST(permintaan(denganTambahan({ kontak_darurat_nomor: "081200000009" })))).status).toBe(400);
    expect((await POST(permintaan(denganTambahan({ kontak_darurat_nama: "Ibu", kontak_darurat_nomor: "12ab" })))).status).toBe(400);
    expect(
      (await POST(permintaan(denganTambahan({ kontak_darurat_nama: "Ibu", kontak_darurat_nomor: "081200000009", golongan_darah: "Z" })))).status
    ).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("kunci yang tidak ada di form_schema dan kunci inti tidak pernah diteruskan", async () => {
    vi.mocked(getLiveEventData).mockResolvedValue({ ...LIVE, kolomTambahan: [] });
    await POST(permintaan(denganTambahan({ liar: "x", nik: "9999999999999999" })));
    const cf = JSON.parse(fetchMock.mock.calls[0][1].body).participants[0].customFields;
    expect(cf).not.toHaveProperty("liar");
    expect(cf.nik).toBe(PII.nik);
  });
});
