import { describe, expect, it } from "vitest";
import {
  aturPemesanIkut,
  bangunPesertaPayload,
  buatIdSesi,
  pilihSesiPengiriman,
  hapusPeserta,
  KeadaanPesanan,
  PemesanForm,
  pemesanIkutLari,
  PesertaForm,
  tambahPeserta,
} from "@/lib/pesananPeserta";

// Data sintetis — bukan data orang sungguhan.
const PEMESAN: PemesanForm = { nama: "Audit Pemesan", email: "pemesan@contoh.test", whatsapp: "081200000001" };

function peserta(key: string, isi: Partial<PesertaForm> = {}): PesertaForm {
  return {
    key,
    nama: "",
    email: "",
    whatsapp: "",
    nik: "",
    jenisIdentitas: "kartu_pelajar",
    gender: "Perempuan",
    wilayah: { provCode: "35", kotaCode: "3518", display: "KAB. NGANJUK", manual: false },
    kategori: "5 KM Reguler",
    size: "M",
    ...isi,
  };
}

function awal(): KeadaanPesanan {
  return { pesertaList: [peserta("peserta-0", { nik: "AUDIT001", size: "L" })], pemesanKey: "peserta-0" };
}

describe("kaitan pemesan memakai key peserta, bukan indeks", () => {
  it("regresi audit: hapus Peserta 1 (pemesan) tidak memindahkan identitas pemesan ke peserta kedua", () => {
    let state = awal();
    state = tambahPeserta(
      state,
      peserta("peserta-1", {
        nama: "Audit Peserta Kedua",
        email: "kedua@contoh.test",
        whatsapp: "081200000002",
        nik: "AUDIT002",
        size: "S",
      }),
      5
    );
    state = hapusPeserta(state, "peserta-0");

    const payload = bangunPesertaPayload(state, PEMESAN, true);
    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({
      nama: "Audit Peserta Kedua",
      email: "kedua@contoh.test",
      whatsapp: "081200000002",
      nik: "AUDIT002",
      size: "S",
    });
    // Tidak ada sisa identitas pemesan di payload.
    expect(JSON.stringify(payload)).not.toContain(PEMESAN.nama);
    expect(state.pemesanKey).toBeNull();
    expect(pemesanIkutLari(state)).toBe(false);
  });

  it("peserta kedua yang belum mengisi nama tetap kosong (ditolak validasi), bukan diisi data pemesan", () => {
    let state = tambahPeserta(awal(), peserta("peserta-1", { nik: "AUDIT002" }), 5);
    state = hapusPeserta(state, "peserta-0");
    const [p] = bangunPesertaPayload(state, PEMESAN, true);
    expect(p.nama).toBe("");
    expect(p.email).toBe("");
    expect(p.whatsapp).toBe("");
    expect(p.nik).toBe("AUDIT002");
  });

  it("menghapus peserta lain tidak mengubah kaitan pemesan maupun data peserta tersisa", () => {
    let state = awal();
    state = tambahPeserta(state, peserta("peserta-1", { nama: "Kedua", nik: "AUDIT002" }), 5);
    state = tambahPeserta(state, peserta("peserta-2", { nama: "Ketiga", nik: "AUDIT003" }), 5);
    state = hapusPeserta(state, "peserta-1");

    const payload = bangunPesertaPayload(state, PEMESAN, true);
    expect(payload.map((p) => [p.nama, p.nik])).toEqual([
      ["Audit Pemesan", "AUDIT001"],
      ["Ketiga", "AUDIT003"],
    ]);
    expect(state.pemesanKey).toBe("peserta-0");
  });

  it("lepas lalu centang lagi: isian milik peserta dikembalikan utuh, pemesan dikaitkan ke peserta teratas", () => {
    let state: KeadaanPesanan = {
      pesertaList: [peserta("peserta-0", { nama: "Isian Sendiri", email: "sendiri@contoh.test", nik: "AUDIT001" })],
      pemesanKey: "peserta-0",
    };
    expect(bangunPesertaPayload(state, PEMESAN, true)[0].nama).toBe("Audit Pemesan");

    state = aturPemesanIkut(state, false);
    expect(bangunPesertaPayload(state, PEMESAN, true)[0]).toMatchObject({
      nama: "Isian Sendiri",
      email: "sendiri@contoh.test",
      nik: "AUDIT001",
    });

    state = aturPemesanIkut(state, true);
    expect(state.pemesanKey).toBe("peserta-0");
    expect(bangunPesertaPayload(state, PEMESAN, true)[0].nama).toBe("Audit Pemesan");
  });

  it("peserta terakhir tidak bisa dihapus dan batas tiket dihormati", () => {
    const satu = awal();
    expect(hapusPeserta(satu, "peserta-0")).toBe(satu);
    let state = satu;
    for (let i = 1; i < 10; i++) state = tambahPeserta(state, peserta(`peserta-${i}`), 3);
    expect(state.pesertaList).toHaveLength(3);
  });

  it("dropdown wilayah mati: hanya teks domisili yang dikirim", () => {
    const [p] = bangunPesertaPayload(awal(), PEMESAN, false);
    expect(p.provCode).toBe("");
    expect(p.kotaCode).toBe("");
    expect(p.kota).toBe("KAB. NGANJUK");
  });
});

describe("properti: urutan tambah/hapus/centang acak tidak pernah mencampur identitas", () => {
  // PRNG deterministik supaya kegagalan bisa diulang persis.
  function prng(seed: number) {
    return () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
  }

  it("setiap baris payload = data peserta itu sendiri, kecuali peserta pemesan (nama/email/WA dari pemesan)", () => {
    for (let percobaan = 0; percobaan < 300; percobaan++) {
      const acak = prng(percobaan + 1);
      let nomor = 1;
      let state = awal();
      const asli = new Map<string, PesertaForm>([[state.pesertaList[0].key, state.pesertaList[0]]]);
      // Model independen: siapa yang SEHARUSNYA mewakili pemesan setelah tiap langkah.
      let pemesanModel: string | null = "peserta-0";

      for (let langkah = 0; langkah < 25; langkah++) {
        const r = acak();
        if (r < 0.4) {
          const key = `peserta-${nomor++}`;
          const baru = peserta(key, {
            nama: `Peserta ${key}`,
            email: `${key}@contoh.test`,
            whatsapp: `0812${String(nomor).padStart(8, "0")}`,
            nik: `ID${String(nomor).padStart(6, "0")}`,
          });
          asli.set(key, baru);
          state = tambahPeserta(state, baru, 5);
        } else if (r < 0.75) {
          const target = state.pesertaList[Math.floor(acak() * state.pesertaList.length)];
          const bisaDihapus = state.pesertaList.length > 1;
          state = hapusPeserta(state, target.key);
          if (bisaDihapus && target.key === pemesanModel) pemesanModel = null;
        } else {
          const ikut = acak() < 0.5;
          state = aturPemesanIkut(state, ikut);
          pemesanModel = ikut ? state.pesertaList[0].key : null;
        }
        expect(state.pemesanKey).toBe(pemesanModel);

        const payload = bangunPesertaPayload(state, PEMESAN, true);
        expect(payload).toHaveLength(state.pesertaList.length);
        // Pemesan hanya boleh terkait ke peserta yang masih ada, dan paling banyak satu.
        if (state.pemesanKey !== null) {
          expect(state.pesertaList.some((p) => p.key === state.pemesanKey)).toBe(true);
        }
        state.pesertaList.forEach((p, i) => {
          const sumber = asli.get(p.key)!;
          const baris = payload[i];
          // Data yang melekat pada orang (identitas, jersey, domisili) selalu miliknya sendiri.
          expect(baris.nik).toBe(sumber.nik);
          expect(baris.size).toBe(sumber.size);
          expect(baris.kota).toBe(sumber.wilayah.display);
          if (p.key === state.pemesanKey) {
            expect([baris.nama, baris.email, baris.whatsapp]).toEqual([PEMESAN.nama, PEMESAN.email, PEMESAN.whatsapp]);
          } else {
            expect([baris.nama, baris.email, baris.whatsapp]).toEqual([sumber.nama, sumber.email, sumber.whatsapp]);
          }
        });
      }
    }
  });
});

describe("kunci idempotensi mengikuti isi pesanan", () => {
  it("isi sama = id sama (kirim ulang setelah hasil belum pasti tidak membuat pesanan baru)", () => {
    let n = 0;
    const buat = () => `id-${++n}`;
    const s1 = pilihSesiPengiriman(null, "isi-A", buat);
    const s2 = pilihSesiPengiriman(s1, "isi-A", buat);
    expect(s2.id).toBe(s1.id);
  });

  it("isi berubah = id baru (core tidak mengembalikan pesanan lama berisi data usang)", () => {
    let n = 0;
    const buat = () => `id-${++n}`;
    const s1 = pilihSesiPengiriman(null, "isi-A", buat);
    const s2 = pilihSesiPengiriman(s1, "isi-B", buat);
    expect(s2.id).not.toBe(s1.id);
    // Kembali ke isi A setelah B = id baru lagi (hanya sesi terakhir yang diingat).
    expect(pilihSesiPengiriman(s2, "isi-A", buat).id).not.toBe(s1.id);
  });

  it("buatIdSesi menghasilkan UUID yang diterima api/daftar", () => {
    const pola = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const ids = new Set(Array.from({ length: 50 }, () => buatIdSesi()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(pola);
  });
});
