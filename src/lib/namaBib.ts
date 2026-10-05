// Nama BIB ("Name On BIB") — nama panggilan yang dicetak di nomor dada.
//
// Kolom ini TIDAK ditentukan situs ini. Panitia menambahkannya di kembarin-v2 sebagai
// field `form_schema` bertipe `name_on_bib`; core mengirim definisinya (beserta
// `maxLength`) lewat GET /api/public/events/{eventCode}. Tidak ada field itu = kolom
// tidak tampil dan nilainya tidak dikirim. Aturan resminya di kembarin-v2
// `domains/shared/nameOnBib.ts`; yang di sini hanya cerminnya untuk UX, core tetap
// menolak isian yang melanggar dengan REGISTRATION_VALIDATION_FAILED.
//
// Opsional: kosong berarti BIB dicetak dengan nama lengkap. Setelah mendaftar peserta
// tidak bisa mengubahnya sendiri — koreksi lewat panitia.

export const NAMA_BIB_TYPE = "name_on_bib";
/** Cadangan bila core belum mengirim `maxLength` — sama dengan batas core (5 Oktober 2026). */
const NAMA_BIB_MAX_CADANGAN = 15;
const POLA_NAMA_BIB = /^[A-Z0-9 .'-]+$/;

export interface KolomNamaBib {
  /** Kunci `customFields` yang dibaca core (nama field di form_schema). */
  fieldName: string;
  label: string;
  maxLength: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** Definisi kolom Nama BIB dari `form_schema` core, atau null bila event tidak memakainya. */
export function bacaKolomNamaBib(formSchema: unknown): KolomNamaBib | null {
  if (!Array.isArray(formSchema)) return null;
  const field = formSchema.filter(isRecord).find((f) => f.type === NAMA_BIB_TYPE);
  if (!field || typeof field.name !== "string" || !field.name.trim()) return null;
  const max = Number(field.maxLength);
  return {
    fieldName: field.name.trim(),
    label: typeof field.label === "string" && field.label.trim() ? field.label.trim() : "Nama BIB",
    maxLength: Number.isInteger(max) && max > 0 ? max : NAMA_BIB_MAX_CADANGAN,
  };
}

/** Huruf besar, gaya "font unik" dilipat, karakter tak terlihat dibuang, spasi dirapatkan. */
export function rapikanNamaBib(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/** Versi ringan untuk onChange: tanpa trim supaya spasi di tengah bisa diketik. */
export function lipatKetikanNamaBib(value: string): string {
  return value.normalize("NFKC").replace(/[\p{Cc}\p{Cf}]/gu, "").toUpperCase();
}

/** Pesan kesalahan, atau null bila sah (termasuk kosong). */
export function validasiNamaBib(value: string, kolom: KolomNamaBib): string | null {
  const t = rapikanNamaBib(value);
  if (!t) return null;
  if (t.length > kolom.maxLength) return `${kolom.label} maksimal ${kolom.maxLength} karakter.`;
  if (!POLA_NAMA_BIB.test(t)) return "Hanya huruf, angka, spasi, titik, tanda kutip, dan strip.";
  return null;
}
