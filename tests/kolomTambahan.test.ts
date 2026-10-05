import { describe, expect, it } from "vitest";
import { bacaKolomTambahan, validasiKolomTambahan } from "@/lib/kolomTambahan";

// Bentuk form_schema publik core (kembarin-v2 domains/shared/publicFormSchema.ts).
const SKEMA = [
  { name: "nama", type: "text", label: "Nama", required: true, semantic: "nama" },
  { name: "nik", type: "text", label: "NIK", required: true, semantic: "nik" },
  { name: "size", type: "select", label: "Jersey", options: ["M"], semantic: "size" },
  { name: "nama_bib", type: "name_on_bib", label: "Name On BIB", semantic: "name_on_bib", maxLength: 15 },
  { name: "kontak_darurat_nama", type: "text", label: "Nama Kontak Darurat", required: true, semantic: null, maxLength: 1000 },
  { name: "kontak_darurat_nomor", type: "tel", label: "Nomor Kontak Darurat", required: true, semantic: null, maxLength: 16 },
  { name: "tanggal_lahir", type: "birthdate", label: "Tanggal Lahir", required: false, semantic: null },
  { name: "golongan_darah", type: "select", label: "Golongan Darah", options: ["A", "O"], semantic: null },
  { name: "kolom_masa_depan", type: "tipe_baru", label: "Kolom Baru", semantic: null },
];

describe("bacaKolomTambahan", () => {
  it("hanya field semantic null, urutan dari panitia, tipe asing jadi teks", () => {
    const kolom = bacaKolomTambahan(SKEMA);
    expect(kolom.map((k) => k.name)).toEqual([
      "kontak_darurat_nama",
      "kontak_darurat_nomor",
      "tanggal_lahir",
      "golongan_darah",
      "kolom_masa_depan",
    ]);
    expect(kolom[1]).toMatchObject({ type: "tel", required: true, maxLength: 16 });
    expect(kolom[4].type).toBe("text");
  });

  it("core lama tanpa penanda semantic = tidak ada kolom (tidak menebak)", () => {
    expect(bacaKolomTambahan([{ name: "golongan_darah", type: "text", label: "Gol" }])).toEqual([]);
    expect(bacaKolomTambahan(undefined)).toEqual([]);
  });
});

describe("validasiKolomTambahan", () => {
  const [nama, nomor, lahir, darah] = bacaKolomTambahan(SKEMA);
  it("wajib, telepon, tanggal, pilihan", () => {
    expect(validasiKolomTambahan(nama, "")).not.toBeNull();
    expect(validasiKolomTambahan(nama, "Ibu Uji")).toBeNull();
    expect(validasiKolomTambahan(nomor, "0812 0000 0009")).toBeNull();
    expect(validasiKolomTambahan(nomor, "0812")).not.toBeNull();
    expect(validasiKolomTambahan(lahir, "")).toBeNull();
    expect(validasiKolomTambahan(lahir, "1990-02-30")).not.toBeNull();
    expect(validasiKolomTambahan(lahir, "1990-05-12")).toBeNull();
    expect(validasiKolomTambahan(darah, "O")).toBeNull();
    expect(validasiKolomTambahan(darah, "Z")).not.toBeNull();
  });
});
