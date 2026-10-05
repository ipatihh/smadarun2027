// Kolom tambahan dari form builder kembarin-v2 — dirender OTOMATIS, tanpa coding di sini.
//
// Core mengirim `form_schema` lewat GET /api/public/events/{eventCode} dengan penanda
// `semantic` per field (kontrak kembarin-v2 docs/PARTNER_INTEGRATION.md §4a). Field yang
// `semantic`-nya bukan null (nama, NIK, WhatsApp, domisili, kategori, ukuran, Nama BIB)
// sudah punya isian khusus di DaftarForm. SEMUA field `semantic: null` — kontak darurat,
// golongan darah, apa pun yang panitia tambahkan kelak — dirender generik per peserta dan
// dikirim di `customFields[field.name]`. Jangan menyaring field null berdasarkan nama.
//
// Validasi di sini cermin aturan core untuk UX; core tetap penentu akhir dan menolak
// isian yang melanggar dengan REGISTRATION_VALIDATION_FAILED.

export type TipeKolom = "text" | "number" | "select" | "birthdate" | "tel" | "email";

export interface KolomTambahan {
  /** Kunci customFields di core (nama field form_schema). */
  name: string;
  label: string;
  type: TipeKolom;
  required: boolean;
  options: string[];
  placeholder: string;
  maxLength: number;
}

/** Batas isian customFields core (normalizeCustomFields) bila core tidak mengirim maxLength. */
const MAX_CADANGAN = 1000;
const POLA_TELEPON = /^\+?\d{8,15}$/;
const POLA_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const POLA_TANGGAL = /^(\d{4})-(\d{2})-(\d{2})$/;
const POLA_ANGKA = /^-?\d+(\.\d+)?$/;
const TIPE_DIKENAL: readonly TipeKolom[] = ["text", "number", "select", "birthdate", "tel", "email"];
/** Kunci yang diisi api/daftar sendiri — kolom bernama sama tidak boleh menimpanya. */
const KUNCI_TERPAKAI = new Set(["nik", "jenis_identitas", "whatsapp", "gender", "kota", "kategori", "size"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/**
 * Kolom tambahan dari form_schema core. Core lama tanpa penanda `semantic` menghasilkan
 * daftar kosong — lebih aman tidak menampilkan apa pun daripada menebak arti kolom.
 */
export function bacaKolomTambahan(formSchema: unknown): KolomTambahan[] {
  if (!Array.isArray(formSchema)) return [];
  const hasil: KolomTambahan[] = [];
  const terlihat = new Set<string>();
  for (const field of formSchema) {
    if (!isRecord(field) || !("semantic" in field) || field.semantic !== null) continue;
    const name = typeof field.name === "string" ? field.name.trim() : "";
    if (!name || name.startsWith("__") || KUNCI_TERPAKAI.has(name.toLowerCase()) || terlihat.has(name)) continue;
    terlihat.add(name);
    const type = TIPE_DIKENAL.includes(field.type as TipeKolom) ? (field.type as TipeKolom) : "text";
    const options = Array.isArray(field.options)
      ? field.options.filter((o): o is string => typeof o === "string" && o.trim() !== "")
      : [];
    const max = Number(field.maxLength);
    hasil.push({
      name,
      label: typeof field.label === "string" && field.label.trim() ? field.label.trim() : name,
      // Select tanpa pilihan tidak bisa diisi; jatuhkan ke teks supaya tetap bisa dikirim.
      type: type === "select" && options.length === 0 ? "text" : type,
      required: field.required === true,
      options,
      placeholder: typeof field.placeholder === "string" ? field.placeholder : "",
      maxLength: Number.isInteger(max) && max > 0 ? Math.min(max, MAX_CADANGAN) : MAX_CADANGAN,
    });
  }
  return hasil;
}

/** Tanggal hari ini menurut WIB, `YYYY-MM-DD` (sama dengan core). */
export function hariIniWib(now: Date = new Date()): string {
  return new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function batasTanggalLahir(now: Date = new Date()): { min: string; max: string } {
  const max = hariIniWib(now);
  return { min: `${Number(max.slice(0, 4)) - 100}-01-01`, max };
}

function tanggalSah(value: string): boolean {
  const m = POLA_TANGGAL.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (d.getUTCFullYear() !== Number(m[1]) || d.getUTCMonth() !== Number(m[2]) - 1 || d.getUTCDate() !== Number(m[3])) {
    return false;
  }
  const { min, max } = batasTanggalLahir();
  return value >= min && value <= max;
}

/** Isian yang dikirim: dirapikan sesuai tipe. */
export function rapikanIsian(kolom: KolomTambahan, value: string): string {
  const t = value.trim();
  return kolom.type === "tel" ? t.replace(/[\s-]/g, "") : t;
}

/** Pesan kesalahan, atau null bila sah. */
export function validasiKolomTambahan(kolom: KolomTambahan, value: string): string | null {
  const t = rapikanIsian(kolom, value);
  if (!t) return kolom.required ? `${kolom.label} wajib diisi.` : null;
  if (t.length > kolom.maxLength) return `${kolom.label} maksimal ${kolom.maxLength} karakter.`;
  switch (kolom.type) {
    case "select":
      return kolom.options.includes(t) ? null : `Pilih ${kolom.label}.`;
    case "tel":
      return POLA_TELEPON.test(t) ? null : `${kolom.label} harus 8–15 digit angka.`;
    case "email":
      return POLA_EMAIL.test(t) ? null : `Format ${kolom.label} belum benar.`;
    case "number":
      return POLA_ANGKA.test(t) ? null : `${kolom.label} hanya berisi angka.`;
    case "birthdate":
      return tanggalSah(t) ? null : `${kolom.label} belum valid.`;
    default:
      return null;
  }
}
