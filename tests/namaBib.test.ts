import { describe, expect, it } from "vitest";
import { bacaKolomNamaBib, rapikanNamaBib, validasiNamaBib } from "@/lib/namaBib";

describe("bacaKolomNamaBib", () => {
  it("membaca field bertipe name_on_bib beserta maxLength dari core", () => {
    const kolom = bacaKolomNamaBib([
      { name: "kategori", type: "select" },
      { name: "nama_bib", type: "name_on_bib", label: "Name On BIB", maxLength: 15 },
    ]);
    expect(kolom).toEqual({ fieldName: "nama_bib", label: "Name On BIB", maxLength: 15 });
  });

  it("event tanpa kolom atau form_schema tidak ada = null", () => {
    expect(bacaKolomNamaBib([{ name: "x", type: "text" }])).toBeNull();
    expect(bacaKolomNamaBib(undefined)).toBeNull();
  });

  it("maxLength tidak dikirim (core lama) jatuh ke batas core 15", () => {
    expect(bacaKolomNamaBib([{ name: "nb", type: "name_on_bib" }])?.maxLength).toBe(15);
  });
});

describe("validasi & rapikan", () => {
  const kolom = { fieldName: "nama_bib", label: "Nama BIB", maxLength: 15 };
  it("huruf besar, spasi rapat, font unik dilipat", () => {
    expect(rapikanNamaBib("  budi   s ")).toBe("BUDI S");
    expect(rapikanNamaBib("𝐁𝐮𝐝𝐢")).toBe("BUDI");
  });
  it("kosong sah, 16 karakter & emoji ditolak", () => {
    expect(validasiNamaBib("", kolom)).toBeNull();
    expect(validasiNamaBib("O'NEIL JR.", kolom)).toBeNull();
    expect(validasiNamaBib("A".repeat(16), kolom)).not.toBeNull();
    expect(validasiNamaBib("BUDI 🏃", kolom)).not.toBeNull();
  });
});
