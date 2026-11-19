import { describe, expect, it } from "vitest";
import { bacaKolomUkuran, biayaUkuran, cocokkanUkuran } from "@/lib/ukuranJersey";

// Bentuk yang dikirim core (kembarin-v2 PARTNER_INTEGRATION §4a), dicek dari respons live 19 Nov 2026.
const SKEMA = [
  { name: "nama", semantic: "nama", type: "text" },
  {
    name: "size",
    type: "select",
    label: "Ukuran Jersey",
    options: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    semantic: "size",
    size_surcharges: { XXL: 10000, XXXL: 10000 },
  },
];

describe("bacaKolomUkuran", () => {
  it("membaca pilihan dan biaya dari kolom semantic size", () => {
    const k = bacaKolomUkuran(SKEMA)!;
    expect(k.options).toEqual(["XS", "S", "M", "L", "XL", "XXL", "XXXL"]);
    expect(k.surcharges).toEqual({ XXL: 10000, XXXL: 10000 });
  });

  it("tanpa size_surcharges = tanpa biaya; tanpa kolom size = null", () => {
    expect(bacaKolomUkuran([{ semantic: "size", options: ["S", "M"] }])).toEqual({ options: ["S", "M"], surcharges: {} });
    expect(bacaKolomUkuran(SKEMA.slice(0, 1))).toBeNull();
    expect(bacaKolomUkuran("bukan array")).toBeNull();
    expect(bacaKolomUkuran([{ semantic: "size", options: [] }])).toBeNull();
  });

  it("mengabaikan nominal tak sah dan label di luar options; kunci dicocokkan tanpa peduli huruf", () => {
    const k = bacaKolomUkuran([
      {
        semantic: "size",
        options: ["S", "XXL", "XXXL"],
        size_surcharges: { xxl: 10000, XXXL: "10.000", S: -5, XXS: 5000, M: 0 },
      },
    ])!;
    expect(k.surcharges).toEqual({ XXL: 10000 });
  });
});

describe("biayaUkuran & cocokkanUkuran", () => {
  const k = bacaKolomUkuran(SKEMA);
  it("biaya per ukuran, 0 bila tidak ada pengaturan atau ukuran kosong", () => {
    expect(biayaUkuran(k, "XXL")).toBe(10000);
    expect(biayaUkuran(k, "xxxl")).toBe(10000);
    expect(biayaUkuran(k, "XL")).toBe(0);
    expect(biayaUkuran(k, "")).toBe(0);
    expect(biayaUkuran(null, "XXL")).toBe(0);
  });

  it("cocokkanUkuran memakai ejaan panitia, cadangan bila core tanpa kolom", () => {
    expect(cocokkanUkuran(k, " xxl ")).toBe("XXL");
    expect(cocokkanUkuran(k, "4XL")).toBeNull();
    expect(cocokkanUkuran(null, "XS")).toBe("XS");
  });
});
