import { describe, expect, it } from "vitest";
import {
  kategoriMengikutiIdentitas,
  kategoriOtomatis,
  kategoriUntukIdentitas,
  validasiKategoriIdentitas,
} from "@/lib/kategoriIdentitas";

const DUA = ["5KM Pelajar", "5KM Umum"];

describe("kategori mengikuti jenis nomor identitas", () => {
  it("Kartu Pelajar hanya kategori pelajar, NIK hanya kategori lain", () => {
    expect(kategoriUntukIdentitas(DUA, "kartu_pelajar")).toEqual(["5KM Pelajar"]);
    expect(kategoriUntukIdentitas(DUA, "nik")).toEqual(["5KM Umum"]);
    expect(kategoriMengikutiIdentitas(DUA)).toBe(true);
  });

  it("tanpa kategori pelajar atau tanpa kategori lain, semua kategori terbuka", () => {
    expect(kategoriUntukIdentitas(["5 KM Reguler"], "kartu_pelajar")).toEqual(["5 KM Reguler"]);
    expect(kategoriUntukIdentitas(["5KM Pelajar"], "nik")).toEqual(["5KM Pelajar"]);
    expect(kategoriMengikutiIdentitas(["5 KM Reguler", "10 KM"])).toBe(false);
  });

  it("ganti jenis identitas memindah kategori otomatis", () => {
    expect(kategoriOtomatis(DUA, "nik", "")).toBe("5KM Umum");
    expect(kategoriOtomatis(DUA, "kartu_pelajar", "5KM Umum")).toBe("5KM Pelajar");
    expect(kategoriOtomatis(["5K", "10K"], "nik", "")).toBe("");
  });

  it("pasangan silang ditolak, pasangan benar lolos", () => {
    expect(validasiKategoriIdentitas(DUA, "kartu_pelajar", "5KM Umum")).toMatch(/pelajar/);
    expect(validasiKategoriIdentitas(DUA, "nik", "5KM Pelajar")).toMatch(/umum/);
    expect(validasiKategoriIdentitas(DUA, "kartu_pelajar", "5KM Pelajar")).toBeNull();
  });
});
