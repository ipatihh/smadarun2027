// Dataset ini SALINAN PERSIS public/data/wilayah/*.json milik kembarin-v2 (dibangkitkan
// oleh scripts/sync-wilayah.mjs di sana). Core memvalidasi ulang kode yang kita kirim
// terhadap salinannya sendiri, jadi kalau core memperbarui dataset, salin ulang ketiga
// berkasnya ke sini — kalau tidak, kabupaten baru akan ditolak core.
import provincesData from "../../public/data/wilayah/provinces.json";
import regenciesData from "../../public/data/wilayah/regencies.json";

export interface WilayahProvince {
  c: string;
  n: string;
}

export interface WilayahRegency {
  c: string;
  n: string;
  p: string;
  full: string;
}

export const PROVINCES = provincesData as WilayahProvince[];
export const REGENCIES = regenciesData as WilayahRegency[];

export const DEFAULT_PROVINCE_CODE = "35";

/** Batas teks kota/kabupaten yang diketik manual — sama dengan form core. */
export const KOTA_MANUAL_MAX_LENGTH = 35;
/** Karakter yang diterima untuk kota manual (dipakai klien & server). */
export const KOTA_MANUAL_PATTERN = /^[a-zA-Z\s.'-]+$/;

const PROVINCE_BY_CODE = new Map(PROVINCES.map((p) => [p.c, p]));
const REGENCY_BY_CODE = new Map(REGENCIES.map((r) => [r.c, r]));

export function getRegenciesByProvince(provCode: string): WilayahRegency[] {
  return REGENCIES.filter((r) => r.p === provCode).sort((a, b) =>
    a.n.localeCompare(b.n, "id")
  );
}

export function resolveProvince(provCode: unknown): WilayahProvince | null {
  if (typeof provCode !== "string") return null;
  return PROVINCE_BY_CODE.get(provCode.trim()) ?? null;
}

/**
 * Kabupaten/kota HARUS anak dari provinsi yang dikirim (Bali + Kab. Nganjuk ditolak).
 * `display` adalah bentuk yang disimpan core di kolom `kota`, mis. `KAB. NGANJUK`.
 */
export function resolveWilayah(
  provCode: unknown,
  kotaCode: unknown
): { prov: WilayahProvince; kota: WilayahRegency; display: string } | null {
  const prov = resolveProvince(provCode);
  if (!prov || typeof kotaCode !== "string") return null;
  const kota = REGENCY_BY_CODE.get(kotaCode.trim());
  if (!kota || kota.p !== prov.c) return null;
  return { prov, kota, display: kota.n.toUpperCase() };
}
