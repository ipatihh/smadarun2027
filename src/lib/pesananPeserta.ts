// Logika murni data pesanan di formulir /daftar: siapa peserta yang mewakili pemesan,
// tambah/hapus peserta, dan bentuk payload `participants[]` yang dikirim ke api/daftar.
// Dipisah dari DaftarForm supaya konsistensi payload bisa diuji tanpa browser
// (lihat tests/pesananPeserta.test.ts).

import type { JenisIdentitas } from "./identitas";
import { rapikanNomorIdentitas } from "./identitas";
import { rapikanNamaBib } from "./namaBib";

export interface WilayahForm {
  provCode: string;
  kotaCode: string;
  display: string;
  manual: boolean;
}

export interface PemesanForm {
  nama: string;
  email: string;
  whatsapp: string;
}

export interface PesertaForm {
  key: string;
  nama: string;
  email: string;
  whatsapp: string;
  nik: string;
  /** Jenis isian `nik`: NIK (16 digit) atau nomor kartu pelajar. */
  jenisIdentitas: JenisIdentitas;
  gender: string;
  wilayah: WilayahForm;
  kategori: string;
  size: string;
  /** Nama BIB; hanya dikirim bila event memasang kolomnya (lihat src/lib/namaBib.ts). */
  namaBib: string;
}

/**
 * Keadaan pesanan yang menentukan isi payload.
 *
 * `pemesanKey` = key peserta yang datanya (nama/email/WhatsApp) diambil dari pemesan,
 * atau null kalau pemesan tidak ikut lari. SENGAJA key, bukan "peserta indeks 0":
 * dulu kaitan pemesan memakai `index === 0`, sehingga menghapus Peserta 1 membuat
 * peserta berikutnya bergeser ke indeks 0 dan diam-diam memakai nama/email/WhatsApp
 * pemesan — sementara NIK, jersey, dan domisilinya tetap milik orang itu. Payload
 * berisi identitas campuran dua orang.
 */
export interface KeadaanPesanan {
  pesertaList: PesertaForm[];
  pemesanKey: string | null;
}

export function pemesanIkutLari(state: KeadaanPesanan): boolean {
  return state.pemesanKey !== null && state.pesertaList.some((p) => p.key === state.pemesanKey);
}

/** Nama/email/WhatsApp efektif peserta: milik pemesan HANYA untuk peserta yang dikaitkan. */
export function dataPesertaEfektif(p: PesertaForm, buyer: PemesanForm, pemesanKey: string | null): PesertaForm {
  return pemesanKey !== null && p.key === pemesanKey
    ? { ...p, nama: buyer.nama, email: buyer.email, whatsapp: buyer.whatsapp }
    : p;
}

/**
 * Centang/hapus centang "pemesan juga ikut lari". Dicentang = pemesan menjadi Peserta 1
 * (peserta paling atas). Isian nama/email/WhatsApp milik peserta itu tidak dihapus —
 * hanya tidak dipakai selama kaitan aktif — jadi melepas centang mengembalikannya utuh.
 */
export function aturPemesanIkut(state: KeadaanPesanan, ikut: boolean): KeadaanPesanan {
  if (!ikut) return { ...state, pemesanKey: null };
  const pertama = state.pesertaList[0];
  return { ...state, pemesanKey: pertama ? pertama.key : null };
}

export function tambahPeserta(state: KeadaanPesanan, baru: PesertaForm, batas: number): KeadaanPesanan {
  if (state.pesertaList.length >= batas) return state;
  return { ...state, pesertaList: [...state.pesertaList, baru] };
}

/**
 * Hapus satu peserta. Kalau yang dihapus adalah peserta pemesan, kaitannya DILEPAS —
 * tidak dipindahkan ke peserta lain. Peserta yang tersisa tetap memakai data miliknya
 * sendiri. Peserta terakhir tidak bisa dihapus.
 */
export function hapusPeserta(state: KeadaanPesanan, key: string): KeadaanPesanan {
  if (state.pesertaList.length <= 1) return state;
  if (!state.pesertaList.some((p) => p.key === key)) return state;
  return {
    pesertaList: state.pesertaList.filter((p) => p.key !== key),
    pemesanKey: state.pemesanKey === key ? null : state.pemesanKey,
  };
}

export interface PesertaPayload {
  nama: string;
  email: string;
  whatsapp: string;
  nik: string;
  jenisIdentitas: JenisIdentitas;
  gender: string;
  provCode: string;
  kotaCode: string;
  kota: string;
  kategori: string;
  size: string;
  namaBib: string;
}

/** Bentuk `participants[]` untuk api/daftar — satu objek per peserta, urutan sama dengan layar. */
export function bangunPesertaPayload(
  state: KeadaanPesanan,
  buyer: PemesanForm,
  wilayahDropdown: boolean
): PesertaPayload[] {
  return state.pesertaList.map((raw) => {
    const p = dataPesertaEfektif(raw, buyer, state.pemesanKey);
    return {
      nama: p.nama.trim(),
      email: p.email.trim(),
      whatsapp: p.whatsapp.trim(),
      nik: rapikanNomorIdentitas(p.nik),
      jenisIdentitas: p.jenisIdentitas,
      gender: p.gender,
      // Kode wilayah ikut dikirim supaya core menyimpan provinsi & kabupaten/kota resmi
      // (prov_code/kota_code), bukan sekadar teks. Server menurunkan ulang nama dari
      // kode; `kota` hanya dipakai untuk isian manual. Saat dropdown dimatikan di
      // kembarin-v2 hanya teks yang dikirim.
      provCode: wilayahDropdown ? p.wilayah.provCode : "",
      kotaCode: wilayahDropdown && !p.wilayah.manual ? p.wilayah.kotaCode : "",
      kota: p.wilayah.display.trim(),
      kategori: p.kategori,
      size: p.size,
      // Milik peserta sendiri, bukan pemesan — tidak ikut dataPesertaEfektif.
      namaBib: rapikanNamaBib(raw.namaBib ?? ""),
    };
  });
}

// ─── Kunci idempotensi pengiriman ───────────────────────────────────────────

/**
 * Kunci idempotensi (`sessionId`) yang dikirim ke core. Core memakai `smadarun:<id>`
 * sebagai idempotency_key unik pesanan: pengiriman ulang dengan id yang sama
 * mengembalikan pesanan yang sudah ada, bukan membuat yang baru.
 *
 * Id diikat ke SIDIK JARI isi pesanan, bukan ke umur halaman:
 * - isi sama (mis. kirim ulang setelah timeout) → id sama → core memakai pesanan yang
 *   mungkin sudah dibuat, tidak ada pesanan ganda;
 * - isi berubah (mis. memperbaiki ukuran jersey) → id baru. Kalau id lama dipakai,
 *   core akan mengembalikan pesanan LAMA berisi data yang sudah tidak berlaku, dan
 *   peserta membayar pesanan yang salah.
 */
export interface SesiPengiriman {
  sidikJari: string;
  id: string;
}

export function pilihSesiPengiriman(
  sebelumnya: SesiPengiriman | null,
  sidikJari: string,
  buatId: () => string
): SesiPengiriman {
  if (sebelumnya && sebelumnya.sidikJari === sidikJari) return sebelumnya;
  return { sidikJari, id: buatId() };
}

/** UUID v4 dari Web Crypto (crypto.randomUUID butuh secure context; ada cadangannya). */
export function buatIdSesi(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
