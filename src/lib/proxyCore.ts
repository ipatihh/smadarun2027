// Perkakas bersama untuk route server yang memproksikan permintaan pengunjung ke core
// (kembarin-v2): api/daftar dan api/status-pesanan. Satu tempat untuk aturan yang
// menyangkut keamanan — pembacaan IP, batas laju, asal permintaan, batas ukuran body,
// header trusted-proxy, dan log tanpa data pribadi — supaya kedua route tidak melenceng.
// Kontrak core: kembarin-v2 docs/PARTNER_INTEGRATION.md.

import type { NextRequest } from "next/server";

/**
 * IP pengunjung asli. PENTING: `x-forwarded-for` bisa diisi sebagian oleh klien —
 * penyerang tinggal mengirim header itu dengan nilai acak tiap request untuk memecah
 * kunci rate limiter (dan, kalau diteruskan mentah, ikut mengelabui rate limiter
 * kembarin-v2 lewat jalur trusted-proxy). Yang boleh dipercaya:
 *   1. `x-vercel-forwarded-for` — ditulis platform, tidak bisa ditimpa klien.
 *   2. entri PALING KANAN dari `x-forwarded-for` — ditambahkan proxy terakhir/terdekat;
 *      bagian kiri adalah bagian yang bisa dikarang klien.
 */
export function getClientIp(req: NextRequest): string {
  const vercelIp = req.headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",").pop()!.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }

  return req.headers.get("x-real-ip") || "127.0.0.1";
}

export const RATE_LIMIT_WINDOW = 60 * 1000;
export type PetaHitungan = Map<string, { count: number; lastReset: number }>;

/**
 * Batas laju per IP di memori SATU instance serverless — saringan lapis pertama,
 * bukan sumber kebenaran (batas terpusat ada di core). true = masih di bawah batas.
 */
export function ambilJatah(map: PetaHitungan, ip: string, batas: number, now: number) {
  if (map.size > 200) {
    map.forEach((data, key) => {
      if (now - data.lastReset > RATE_LIMIT_WINDOW) map.delete(key);
    });
  }
  const data = map.get(ip);
  if (!data || now - data.lastReset > RATE_LIMIT_WINDOW) {
    map.set(ip, { count: 1, lastReset: now });
    return { ok: true, retryAfter: 0 };
  }
  if (data.count >= batas) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((RATE_LIMIT_WINDOW - (now - data.lastReset)) / 1000)) };
  }
  data.count++;
  return { ok: true, retryAfter: 0 };
}

/**
 * Permintaan lintas situs ditolak. Endpoint ini anonim (bukan soal sesi/CSRF akun), tetapi
 * tidak ada klien sah selain halaman di situs ini sendiri. Request tanpa header Origin
 * (alat server-to-server, browser lama) tetap diterima — validasi isian tetap berlaku.
 */
export function asalDiizinkan(req: NextRequest): boolean {
  if (req.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].trim();
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function contentTypeJson(req: NextRequest): boolean {
  return /^application\/json(\s*;|$)/i.test((req.headers.get("content-type") ?? "").trim());
}

/** Baca stream sampai `batas` byte; null bila melebihi batas. */
export async function bacaTeksTerbatas(stream: ReadableStream<Uint8Array> | null, batas: number): Promise<string | null> {
  if (!stream) return "";
  const reader = stream.getReader();
  const potongan: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > batas) {
      await reader.cancel().catch(() => {});
      return null;
    }
    potongan.push(value);
  }
  const gabung = new Uint8Array(total);
  let offset = 0;
  for (const p of potongan) {
    gabung.set(p, offset);
    offset += p.byteLength;
  }
  return new TextDecoder().decode(gabung);
}

/** Body request sebagai teks, menghormati Content-Length dan batas byte; null = terlalu besar. */
export async function bacaBodyRequest(req: NextRequest, batas: number): Promise<string | null> {
  const panjangDinyatakan = Number(req.headers.get("content-length"));
  if (Number.isFinite(panjangDinyatakan) && panjangDinyatakan > batas) return null;
  return bacaTeksTerbatas(req.body, batas);
}

/**
 * Header ke core. Header trusted-proxy memberi tahu core IP pengunjung ASLI (bukan IP
 * egress server smadarun2027), supaya batas laju per pengunjung di core tidak salah tembak.
 * Opt-in — tanpa TRUSTED_PROXY_API_KEY header ini tidak dikirim dan core menghitung IP
 * server partner. Nilainya harus sama dengan secret partner di core (TRUSTED_PARTNER_KEYS
 * `smadarun:<secret>` atau TRUSTED_PROXY_API_KEY lama — keduanya diterima core).
 */
export function headerKeCore(ip: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const trustedProxyKey = process.env.TRUSTED_PROXY_API_KEY;
  if (trustedProxyKey) {
    headers["X-Trusted-Proxy-Key"] = trustedProxyKey;
    headers["X-Forwarded-Client-Ip"] = ip;
  }
  return headers;
}

/** URL endpoint core. KEMBAR_IN_API_URL = URL lengkap pendaftaran; endpoint lain satu origin dengannya. */
export function urlCore(path: "register" | "status"): string {
  const register = process.env.KEMBAR_IN_API_URL || "https://kembar.in/api/participants/register";
  if (path === "register") return register;
  return `${new URL(register).origin}/api/public/orders/status`;
}

/**
 * Log terstruktur TANPA isi request/respons. Body error core bisa memantulkan nama, email,
 * nomor identitas, atau WhatsApp, dan token status pesanan adalah kunci akses — tidak
 * satu pun boleh masuk log. Yang dicatat hanya kode rujukan, status, dan kode error.
 */
export function catat(src: string, event: string, data: Record<string, string | number | undefined>) {
  console.error(JSON.stringify({ src, event, ...data }));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
