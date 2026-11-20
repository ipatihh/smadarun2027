import { describe, expect, it } from "vitest";
import { adaKategoriPelajarDanUmum, isKategoriPelajar } from "@/lib/kategoriPelajar";

describe("kategori pelajar", () => {
  it("mengenali kategori pelajar dari namanya", () => {
    expect(isKategoriPelajar("5KM Pelajar")).toBe(true);
    expect(isKategoriPelajar("5km pelajar")).toBe(true);
    expect(isKategoriPelajar("5KM Umum")).toBe(false);
    expect(isKategoriPelajar("5 KM Reguler")).toBe(false);
  });

  it("memisahkan kelompok hanya bila ada kategori pelajar DAN kategori lain", () => {
    expect(adaKategoriPelajarDanUmum(["5KM Pelajar", "5KM Umum"])).toBe(true);
    expect(adaKategoriPelajarDanUmum(["5 KM Reguler"])).toBe(false);
    expect(adaKategoriPelajarDanUmum(["5KM Pelajar"])).toBe(false);
    expect(adaKategoriPelajarDanUmum(["5 KM Reguler", "10 KM"])).toBe(false);
  });
});
