// Ukuran jersey & biaya tambahan per ukuran.
//
// Daftar ukuran dan biayanya TIDAK ditentukan situs ini. Panitia mengaturnya di kolom
// ukuran jersey (`semantic: "size"`) pada Form Builder kembarin-v2; core mengirimnya lewat
// GET /api/public/events/{eventCode} sebagai `options` dan `size_surcharges`
// ({ "XXL": 10000 }). Kontrak: kembarin-v2 docs/PARTNER_INTEGRATION.md §4a.
//
// Aturan penjumlahan (identik dengan core): nominal peserta = harga tiket + biaya ukuran
// (satu jersey per peserta); biaya ukuran TIDAK dikenai biaya layanan tambahan. Nominal dari
// browser tidak pernah dipercaya, core menghitung ulang dari database.

/** Cadangan bila core tidak mengirim kolom ukuran (core lama / kolom belum dipasang). */
export const UKURAN_JERSEY_CADANGAN = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export interface KolomUkuran {
  /** Pilihan ukuran, urutan sesuai isian panitia. */
  options: string[];
  /** Biaya tambahan per jersey (Rupiah, bilangan bulat > 0), kunci = ejaan persis di `options`. */
  surcharges: Record<string, number>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** Kolom ukuran dari `form_schema` core, atau null bila event tidak punya kolom ukuran. */
export function bacaKolomUkuran(formSchema: unknown): KolomUkuran | null {
  if (!Array.isArray(formSchema)) return null;
  const field = formSchema.filter(isRecord).find((f) => f.semantic === "size");
  if (!field || !Array.isArray(field.options)) return null;

  const options = field.options
    .filter((o): o is string => typeof o === "string")
    .map((o) => o.trim())
    .filter((o, i, semua) => o.length > 0 && semua.indexOf(o) === i);
  if (options.length === 0) return null;

  const surcharges: Record<string, number> = {};
  if (isRecord(field.size_surcharges)) {
    for (const [label, nilai] of Object.entries(field.size_surcharges)) {
      const jumlah = typeof nilai === "number" ? nilai : NaN;
      // Hanya bilangan bulat Rupiah > 0; nilai lain dianggap tidak ada biaya (core pun menolak simpannya).
      if (!Number.isSafeInteger(jumlah) || jumlah <= 0) continue;
      // Kunci dicocokkan ke ejaan `options` tanpa peduli huruf besar-kecil, seperti core.
      const ejaan = options.find((o) => o.toLowerCase() === label.trim().toLowerCase());
      if (ejaan) surcharges[ejaan] = jumlah;
    }
  }
  return { options, surcharges };
}

/** Biaya tambahan untuk ukuran ini (0 bila tidak ada pengaturan). */
export function biayaUkuran(kolom: KolomUkuran | null, size: string): number {
  if (!kolom || !size) return 0;
  const kunci = Object.keys(kolom.surcharges).find((k) => k.toLowerCase() === size.trim().toLowerCase());
  return kunci ? kolom.surcharges[kunci] : 0;
}

/** Ukuran yang sah menurut core; dikembalikan dengan ejaan panitia, atau null bila tidak dikenal. */
export function cocokkanUkuran(kolom: KolomUkuran | null, size: string): string | null {
  const daftar = kolom?.options ?? UKURAN_JERSEY_CADANGAN;
  return daftar.find((o) => o.toLowerCase() === size.trim().toLowerCase()) ?? null;
}
