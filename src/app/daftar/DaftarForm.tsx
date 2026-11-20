"use client";

import React, { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore, ChangeEvent, FocusEvent, FormEvent } from "react";
import Image from "next/image";
import { kapitalNama, rapikanNama } from "@/lib/nama";
import { suggestEmailCorrection } from "@/lib/emailTypo";
import Link from "next/link";
import WilayahSelect, { WilayahValue, createEmptyWilayah } from "@/components/WilayahSelect";
import IsiKebijakanPrivasi from "@/components/legal/IsiKebijakanPrivasi";
import { KOTA_MANUAL_MAX_LENGTH, KOTA_MANUAL_PATTERN } from "@/lib/wilayah";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { FiArrowLeft, FiMinus, FiPlus } from "react-icons/fi";
import { fasilitasSemuaKategori, tiketMarketing } from "@/data/tiket";
import { flyerPendaftaran } from "@/data/flyer";
import { LiveTicketType } from "@/lib/kembarinEvents";
import { KolomNamaBib, lipatKetikanNamaBib, validasiNamaBib } from "@/lib/namaBib";
import { biayaUkuran, UKURAN_JERSEY_CADANGAN, type KolomUkuran } from "@/lib/ukuranJersey";
import { adalahNamaKontakDarurat, batasTanggalLahir, KolomTambahan, rapikanIsian, validasiKolomTambahan } from "@/lib/kolomTambahan";
import {
  JenisIdentitas,
  kunciIdentitas,
  LABEL_JENIS_IDENTITAS,
  NOMOR_IDENTITAS_MAX,
  validasiIdentitas,
} from "@/lib/identitas";
import { isKategoriPelajar } from "@/lib/kategoriPelajar";
import { PESAN_BELUM_PASTI, tafsirkanResponsDaftar } from "@/lib/kontrakPendaftaran";
import { VERSI_PERSETUJUAN } from "@/lib/persetujuan";
import { simpanPesananTerakhir } from "@/lib/statusPesanan";
import {
  bangunPesertaPayload,
  buatIdSesi,
  dataPesertaEfektif,
  hapusPeserta as hapusPesertaDariPesanan,
  KeadaanPesanan,
  PemesanForm,
  PesertaForm,
  pilihSesiPengiriman,
  SesiPengiriman,
  tambahPeserta as tambahPesertaKePesanan,
} from "@/lib/pesananPeserta";

// Lebih lama dari batas api/daftar (data live ±8 dtk + core 25 dtk) supaya browser tidak
// menyerah lebih dulu daripada server. Tidak ada pengiriman ulang otomatis.
const BATAS_TUNGGU_KLIEN_MS = 45_000;
// Bila browser belum berpindah ke halaman pembayaran setelah ini, tautannya ditampilkan.
const JEDA_TAUTAN_CADANGAN_MS = 8_000;

type JenisModal = "berhasil" | "gagal" | "belum-pasti";

type BuyerState = PemesanForm;
type PesertaState = PesertaForm;

type BuyerField = keyof BuyerState;
// `jenisIdentitas` bukan isian yang divalidasi sendiri — ia menentukan aturan untuk `nik`.
type PesertaField = Exclude<keyof PesertaState, "key" | "jenisIdentitas" | "tambahan">;

// Cermin dari validasi server di api/daftar/route.ts. Tujuannya UX: pengguna tahu
// kesalahan format SEBELUM menekan bayar, bukan lewat modal setelah request bolak-balik.
// Server tetap jadi penentu akhir — validasi di sini tidak menggantikannya.
const validasiNama = (v: string, label: string) => {
  const t = rapikanNama(v);
  if (!t) return `${label} wajib diisi.`;
  if (t.length < 3) return `${label} minimal 3 karakter.`;
  if (t.length > 100) return `${label} maksimal 100 karakter.`;
  if (!/^[a-zA-Z\s.']+$/.test(t)) return "Hanya huruf, spasi, titik, dan tanda kutip yang diperbolehkan.";
  return null;
};

const validasiEmail = (v: string, wajib: boolean) => {
  const t = v.trim();
  if (!t) return wajib ? "Email wajib diisi." : null;
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(t)) return "Format email belum benar, contoh: nama@email.com";
  // Domain salah ketik (gemail.com, gmail.co) memantul; core juga menolaknya.
  if (suggestEmailCorrection(t)) return "Domain email sepertinya salah ketik.";
  return null;
};

const validasiWhatsapp = (v: string, wajib: boolean) => {
  const t = v.trim();
  if (!t) return wajib ? "Nomor WhatsApp wajib diisi." : null;
  if (!/^\+?\d{8,15}$/.test(t)) return "Isi 8–15 digit angka tanpa spasi/strip, contoh: 081234567890";
  return null;
};

const VALIDATOR_BUYER: Record<BuyerField, (v: string) => string | null> = {
  nama: (v) => validasiNama(v, "Nama Pemesan"),
  email: (v) => validasiEmail(v, true),
  whatsapp: (v) => validasiWhatsapp(v, true),
};

const VALIDATOR_PESERTA: Record<PesertaField, (v: any, p: PesertaState) => string | null> = {
  nama: (v) => validasiNama(v, "Nama peserta"),
  email: (v) => validasiEmail(v, false),
  whatsapp: (v) => validasiWhatsapp(v, false),
  nik: (v, p) => validasiIdentitas(p.jenisIdentitas, v),
  gender: (v) => (v ? null : "Pilih Jenis Kelamin."),
  wilayah: (v: WilayahValue) => {
    if (!v.provCode) return "Provinsi domisili wajib dipilih.";
    if (!v.kotaCode && !v.manual) return "Kota / Kabupaten domisili wajib dipilih.";
    if (v.manual) {
      // Disamakan dengan validasi server — tanpa ini isian seperti "Kota Batu, Malang"
      // baru ditolak setelah tombol bayar ditekan.
      const t = v.display.trim();
      if (!t) return "Kota / Kabupaten domisili wajib diisi.";
      if (t.length < 2) return "Nama kota / kabupaten minimal 2 karakter.";
      if (t.length > KOTA_MANUAL_MAX_LENGTH) return `Nama kota / kabupaten maksimal ${KOTA_MANUAL_MAX_LENGTH} karakter.`;
      if (!KOTA_MANUAL_PATTERN.test(t)) return "Hanya huruf, spasi, titik, strip, dan tanda kutip yang diperbolehkan.";
    }
    return null;
  },
  kategori: (v) => (v ? null : "Pilih kategori lomba."),
  size: (v) => (v ? null : "Pilih Ukuran jersey."),
  // Bergantung pada kolom dari core — dinilai di validasiPeserta.
  namaBib: () => null,
};

// Domisili teks bebas, dipakai saat dropdown wilayah dimatikan di kembarin-v2.
// Cermin cabang tanpa provinsi di api/daftar/route.ts (maksimal 100 karakter).
const validasiKotaBebas = (v: string) => {
  const t = v.trim();
  if (!t) return "Kota domisili wajib diisi.";
  if (t.length < 2) return "Nama kota minimal 2 karakter.";
  if (t.length > 100) return "Nama kota maksimal 100 karakter.";
  if (!KOTA_MANUAL_PATTERN.test(t)) return "Hanya huruf, spasi, titik, strip, dan tanda kutip yang diperbolehkan.";
  return null;
};

// Urutan ini menentukan field mana yang difokuskan lebih dulu saat submit gagal.
const URUTAN_BUYER: BuyerField[] = ["nama", "email", "whatsapp"];
const URUTAN_PESERTA: PesertaField[] = ["nama", "namaBib", "nik", "gender", "wilayah", "kategori", "size", "email", "whatsapp"];

interface DaftarFormProps {
  ticketTypes: LiveTicketType[];
  isOpen: boolean;
  comingSoon?: boolean;
  // Biaya layanan/admin PER TIKET, live dari event_config.admin_fee_amount kembarin-v2
  // (lihat src/lib/kembarinEvents.ts) — bukan hardcode di sisi ini.
  adminFee: number;
  /** Nama biaya dari core (event_config.admin_fee_label). */
  adminFeeLabel: string;
  /** Jadwal pembukaan pendaftaran yang sudah diformat WIB, kalau panitia mengisinya. */
  opensAtLabel: string | null;
  /** Pembelian kolektif aktif atau tidak (event_config.multi_ticket_enabled). */
  multiTicketEnabled: boolean;
  /** Batas tiket per pesanan (event_config.max_tickets_per_order). */
  maxTicketsPerOrder: number;
  /** Dropdown wilayah resmi atau teks bebas (event_config.enable_wilayah_dropdown). */
  wilayahDropdown: boolean;
  /** Kolom Nama BIB dari form_schema kembarin-v2; null = tidak dipasang panitia. */
  namaBib: KolomNamaBib | null;
  /** Kolom lain dari form builder kembarin-v2, dirender generik (src/lib/kolomTambahan.ts). */
  kolomTambahan: KolomTambahan[];
  /** Pilihan ukuran jersey + biaya tambahan per ukuran dari core; null = daftar cadangan tanpa biaya. */
  ukuranJersey: KolomUkuran | null;
  /** Tanggal hari-H yang sudah diformat WIB (live dari core); null = belum diumumkan. */
  tanggalEvent: string | null;
  /** Lokasi hari-H apa adanya dari core; null = belum diumumkan. */
  lokasi: string | null;
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const fieldClass = (hasError: boolean) =>
  `min-h-12 w-full rounded-field border bg-card px-4 py-3 text-base text-foreground sm:text-sm outline-none transition placeholder:text-muted-foreground focus:ring-4 ${
    hasError
      ? "border-danger focus:border-danger focus:ring-danger/20"
      : "border-field-border focus:border-focus focus:ring-focus/15"
  }`;

const labelClass = "mb-2 block text-sm font-medium text-foreground";

/** "+10rb" untuk kelipatan seribu (muat di tombol ukuran), selain itu "+Rp12.500". */
const biayaRingkas = (n: number) => (n % 1000 === 0 ? `+${n / 1000}rb` : `+${rupiah(n)}`);

// Tampilan pilihan tombol (ukuran jersey, jenis kelamin, jenis identitas). Dipasang di <span>
// setelah <input type="radio" class="peer sr-only">, jadi tetap radio sungguhan: bisa dengan keyboard.
const kelasPilihan = (hasError: boolean) =>
  `flex min-h-11 items-center justify-center rounded-field border bg-card px-2 text-center text-sm font-medium text-foreground transition hover:border-foreground-accent peer-checked:border-primary-accent peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:ring-2 peer-focus-visible:ring-focus ${
    hasError ? "border-danger" : "border-field-border"
  }`;

const FieldError: React.FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p id={id} role="alert" className="mt-1.5 text-xs font-semibold text-danger">
      {message}
    </p>
  ) : null;

type LangkahForm = 1 | 2 | 3;
// Sama dengan alur kembar.in (core): Tiket & Pemesan → Data Peserta → Tinjau & Bayar.
const NAMA_LANGKAH = ["Tiket & Pemesan", "Data Peserta", "Tinjau & Bayar"] as const;
const SEMUA_LANGKAH: LangkahForm[] = [1, 2, 3];

/** Penanda tahapan tipis: garis kemajuan + label. Langkah yang sudah lewat bisa diklik untuk mundur. */
const StepNav: React.FC<{ langkah: LangkahForm; onPilih: (n: LangkahForm) => void }> = ({ langkah, onPilih }) => (
  <nav aria-label="Tahapan pendaftaran">
    <ol className="grid grid-cols-3 gap-3">
      {SEMUA_LANGKAH.map((n) => {
        const lewat = n < langkah;
        const aktif = n === langkah;
        return (
          <li key={n}>
            <button
              type="button"
              disabled={!lewat}
              onClick={() => onPilih(n)}
              aria-current={aktif ? "step" : undefined}
              className="block w-full rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default"
            >
              <span className={`block h-1 rounded-full transition-colors ${aktif || lewat ? "bg-primary" : "bg-border-strong/50"}`} />
              <span
                className={`mt-2 block text-xs sm:text-sm ${
                  aktif ? "font-semibold text-foreground" : lewat ? "font-medium text-foreground-accent" : "text-muted-foreground"
                }`}
              >
                {NAMA_LANGKAH[n - 1]}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);

// Key dibuat pemanggil, bukan penghitung tingkat modul: penghitung modul bertahan
// antar-request di server, sehingga HTML server bisa bernama `peserta-4` sementara
// browser memulai dari `peserta-1` (hydration mismatch pada `name` radio identitas,
// dan nama server itu bisa bertabrakan dengan peserta yang ditambah belakangan).
const pesertaBaru = (key: string, kategoriDefault: string): PesertaState => ({
  key,
  nama: "",
  email: "",
  whatsapp: "",
  nik: "",
  jenisIdentitas: "nik",
  gender: "",
  wilayah: createEmptyWilayah(),
  kategori: kategoriDefault,
  size: "",
  namaBib: "",
  tambahan: {},
});

export default function DaftarForm({
  ticketTypes,
  isOpen,
  comingSoon = false,
  adminFee,
  adminFeeLabel,
  opensAtLabel,
  multiTicketEnabled,
  maxTicketsPerOrder,
  wilayahDropdown,
  namaBib,
  kolomTambahan,
  ukuranJersey,
  tanggalEvent,
  lokasi,
}: DaftarFormProps) {
  const WEBHOOK_URL = "/api/daftar";
  const imageSrc = "/images/size-chart-jersey.webp";

  // Kategori & harga live dari kembarin-v2 (props dari Server Component page.tsx).
  const KATEGORI_TIKET: Record<string, { label: string; price: number }> = useMemo(
    () =>
      Object.fromEntries(
        ticketTypes.map((t) => {
          const marketing = tiketMarketing.find(
            (m) => m.categoryKey.toLowerCase() === t.categoryKey.toLowerCase()
          );
          return [t.categoryKey, { label: marketing?.name ?? t.categoryKey, price: t.price }];
        })
      ),
    [ticketTypes]
  );
  const KATEGORI_KEYS = Object.keys(KATEGORI_TIKET);
  // Seperti kembar.in: bila ada lebih dari satu kategori, peserta HARUS memilihnya sendiri di langkah 2
  // (tidak ada yang terpilih diam-diam); dengan satu kategori, itu yang terpilih sejak awal.
  // Kategori TIDAK ditentukan jenis nomor identitas (NIK/kartu pelajar): pelajar sering memakai NIK
  // (`@/lib/kategoriPelajar`, keputusan pemilik 20 Nov 2026).
  const kategoriAwal = KATEGORI_KEYS.length > 1 ? "" : KATEGORI_KEYS[0] || "";
  const PENDAFTARAN_DIBUKA = isOpen && KATEGORI_KEYS.length > 0;
  const isFormClosed = !PENDAFTARAN_DIBUKA;
  // Coming Soon: harga disembunyikan sampai pendaftaran dibuka.
  // Nilai 0 ditulis "Gratis" (mis. biaya layanan yang dinolkan panitia di core), bukan "Rp 0".
  const harga = (nilai: number) => (comingSoon ? "Menyusul" : nilai === 0 ? "Gratis" : rupiah(nilai));
  const batasTiket = Math.max(1, maxTicketsPerOrder);

  const [buyer, setBuyer] = useState<BuyerState>({ nama: "", email: "", whatsapp: "" });
  const [buyerErrors, setBuyerErrors] = useState<Partial<Record<BuyerField, string>>>({});

  // Peserta awal selalu `peserta-0` supaya render server dan browser identik. Peserta
  // berikutnya hanya dibuat di browser, nomornya dari ref milik komponen ini.
  const nomorKeyBerikut = useRef(1);
  const keyPesertaBaru = () => `peserta-${nomorKeyBerikut.current++}`;
  // Tanpa kaitan otomatis pemesan→peserta (pemesanKey null): seperti di kembar.in, pemesan menekan
  // "Gunakan data pemesan" bila ia sendiri ikut lari, dan datanya disalin (bukan ditautkan).
  const [pesanan, setPesanan] = useState<KeadaanPesanan>(() => ({
    pesertaList: [pesertaBaru("peserta-0", kategoriAwal)],
    pemesanKey: null,
  }));
  const pesertaList = pesanan.pesertaList;
  const setPesertaList = (ubah: (prev: PesertaState[]) => PesertaState[]) =>
    setPesanan((prev) => ({ ...prev, pesertaList: ubah(prev.pesertaList) }));
  const [pesertaErrors, setPesertaErrors] = useState<Record<string, Partial<Record<PesertaField, string>>>>({});

  const [isHealthyChecked, setIsHealthyChecked] = useState(false);
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [consentErrors, setConsentErrors] = useState<{ health?: string; privacy?: string }>({});

  /**
   * 'redirecting' penting dan bukan sekadar kosmetik: setelah paymentUrl diterima,
   * browser butuh waktu berpindah ke halaman pembayaran. Sebelumnya blok `finally` mengembalikan
   * tombol ke keadaan diam SEBELUM perpindahan itu terjadi, sehingga di detik-detik
   * terakhir halaman tampak menganggur — persis kesan "stuck".
   */
  const [status, setStatus] = useState<"idle" | "submitting" | "redirecting">("idle");
  const loading = status !== "idle";
  const [langkah, setLangkah] = useState<LangkahForm>(1);
  // Tiket (peserta) yang sedang diisi di langkah 2 — satu tiket per layar.
  const [pesertaAktif, setPesertaAktif] = useState(0);
  const [isImgOpen, setIsImgOpen] = useState(false);
  const [isFlyerOpen, setIsFlyerOpen] = useState(false);
  const [isPrivasiOpen, setIsPrivasiOpen] = useState(false);
  const [modal, setModal] = useState<{
    show: boolean;
    jenis: JenisModal;
    title: string;
    message: string;
    kode?: string;
    ref?: string;
  }>({ show: false, jenis: "gagal", title: "", message: "" });
  // Kunci idempotensi pengiriman terakhir — lihat pilihSesiPengiriman.
  const sesiPengiriman = useRef<SesiPengiriman | null>(null);
  // Tautan bayar yang sedang dituju; ditampilkan sebagai cadangan bila pengalihan macet.
  const [tautanBayar, setTautanBayar] = useState<{ url: string; kode: string } | null>(null);
  const [tampilkanCadangan, setTampilkanCadangan] = useState(false);

  // Kembali dari halaman pembayaran lewat tombol Back bisa memulihkan halaman ini dari
  // bfcache dalam keadaan "Mengalihkan…" selamanya. Kembalikan ke formulir (isian utuh).
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setStatus("idle");
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const efektif = (p: PesertaState): PesertaState => dataPesertaEfektif(p, buyer, pesanan.pemesanKey);

  const hargaPeserta = (p: PesertaState) => KATEGORI_TIKET[p.kategori]?.price ?? 0;

  // Biaya tambahan ukuran jersey (dari core), per peserta. Bagian dari subtotal seperti di core:
  // nominal peserta = harga tiket + biaya ukuran; biaya layanan TIDAK dikenakan atasnya.
  const biayaPeserta = (p: PesertaState) => biayaUkuran(ukuranJersey, p.size);
  const daftarUkuran = ukuranJersey?.options ?? UKURAN_JERSEY_CADANGAN;

  const subtotal = pesertaList.reduce((sum, p) => sum + hargaPeserta(p) + biayaPeserta(p), 0);
  // BIAYA LAYANAN DIHITUNG PER TIKET, bukan per pesanan — sama seperti calculateAdminFee()
  // di kembarin-v2 (feePerTicket * ticketCount). Pesanan 5 tiket = 5 x biaya layanan.
  const totalAdminFee = adminFee * pesertaList.length;
  const totalAmount = subtotal + totalAdminFee;

  const bolehTambahPeserta = multiTicketEnabled && pesertaList.length < batasTiket;

  const handleBuyerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBuyer((prev) => ({ ...prev, [name]: name === "nama" ? kapitalNama(value) : value }));
    if (buyerErrors[name as BuyerField]) {
      setBuyerErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBuyerBlur = (e: FocusEvent<HTMLInputElement>) => {
    const name = e.target.name as BuyerField;
    if (name === "nama") setBuyer((prev) => ({ ...prev, nama: rapikanNama(prev.nama) }));
    setBuyerErrors((prev) => ({ ...prev, [name]: VALIDATOR_BUYER[name](e.target.value) ?? undefined }));
  };

  const handlePesertaChange = (key: string, field: PesertaField, value: any) => {
    setPesertaList((prev) => prev.map((p) => (p.key === key ? { ...p, [field]: field === "nama" ? kapitalNama(value) : value } : p)));
    if (pesertaErrors[key]?.[field]) {
      setPesertaErrors((prev) => ({ ...prev, [key]: { ...prev[key], [field]: undefined } }));
    }
  };

  const validasiPeserta = (field: PesertaField, value: any, p: PesertaState) =>
    field === "wilayah" && !wilayahDropdown
      ? validasiKotaBebas((value as WilayahValue).display)
      : field === "namaBib"
        ? namaBib
          ? validasiNamaBib(String(value ?? ""), namaBib)
          : null
        : VALIDATOR_PESERTA[field](value, p);

  const handlePesertaBlur = (key: string, field: PesertaField, value: any) => {
    const peserta = pesertaList.find((p) => p.key === key);
    if (!peserta) return;
    if (field === "nama") setPesertaList((prev) => prev.map((p) => p.key === key ? { ...p, nama: rapikanNama(p.nama) } : p));
    const message = validasiPeserta(field, value, peserta);
    setPesertaErrors((prev) => ({ ...prev, [key]: { ...prev[key], [field]: message ?? undefined } }));
  };

  // Ganti NIK <-> kartu pelajar. Isian yang sudah diketik dinilai ulang dengan aturan
  // jenis barunya, supaya pesan "harus 16 digit" tidak tertinggal setelah pindah jenis.
  const gantiJenisIdentitas = (key: string, jenis: JenisIdentitas) => {
    const peserta = pesertaList.find((p) => p.key === key);
    if (!peserta || peserta.jenisIdentitas === jenis) return;
    setPesertaList((prev) => prev.map((p) => (p.key === key ? { ...p, jenisIdentitas: jenis } : p)));
    const message = peserta.nik.trim() ? validasiIdentitas(jenis, peserta.nik) : null;
    setPesertaErrors((prev) => ({ ...prev, [key]: { ...prev[key], nik: message ?? undefined } }));
  };

  // Penghitung tiket di langkah 1 (seperti di kembar.in): menambah/mengurangi peserta dari ujung.
  const ubahJumlahTiket = (n: number) => {
    const target = Math.min(Math.max(1, n), batasTiket);
    const selisih = target - pesertaList.length;
    if (selisih > 0) {
      const baru = Array.from({ length: selisih }, () => pesertaBaru(keyPesertaBaru(), kategoriAwal));
      setPesanan((prev) => baru.reduce((acc, peserta) => tambahPesertaKePesanan(acc, peserta, batasTiket), prev));
    } else if (selisih < 0) {
      pesertaList.slice(target).forEach((peserta) => hapusPeserta(peserta.key));
    }
    setPesertaAktif((a) => Math.min(a, target - 1));
  };

  // "Gunakan data pemesan": menyalin nama/email/WhatsApp pemesan ke tiket yang sedang diisi.
  const salinDataPemesan = () => {
    const key = pesertaList[pesertaAktif]?.key;
    if (!key) return;
    setPesertaList((prev) =>
      prev.map((p) =>
        p.key === key ? { ...p, nama: rapikanNama(buyer.nama), email: buyer.email.trim(), whatsapp: buyer.whatsapp.trim() } : p,
      ),
    );
    setPesertaErrors((prev) => ({ ...prev, [key]: { ...prev[key], nama: undefined } }));
  };

  // Menghapus peserta; data peserta lain tidak ikut berubah.
  const hapusPeserta = (key: string) => {
    setPesanan((prev) => hapusPesertaDariPesanan(prev, key));
    setPesertaErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setTambahanErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // ── Kolom tambahan dari form builder core (kunci = nama field) ─────────────
  const [tambahanErrors, setTambahanErrors] = useState<Record<string, Record<string, string | undefined>>>({});
  const tanggalLahir = useMemo(() => batasTanggalLahir(), []);

  const ubahTambahan = (key: string, kolom: KolomTambahan, value: string) => {
    setPesertaList((prev) =>
      prev.map((p) => (p.key === key ? { ...p, tambahan: { ...p.tambahan, [kolom.name]: adalahNamaKontakDarurat(kolom) ? kapitalNama(value) : value } } : p))
    );
    if (tambahanErrors[key]?.[kolom.name]) {
      setTambahanErrors((prev) => ({ ...prev, [key]: { ...prev[key], [kolom.name]: undefined } }));
    }
  };

  const blurTambahan = (key: string, kolom: KolomTambahan, value: string) => {
    if (adalahNamaKontakDarurat(kolom)) ubahTambahan(key, kolom, rapikanIsian(kolom, value));
    const message = validasiKolomTambahan(kolom, value);
    setTambahanErrors((prev) => ({ ...prev, [key]: { ...prev[key], [kolom.name]: message ?? undefined } }));
  };

  const focusField = (id: string) => {
    let el = document.getElementById(id);
    // Isian kota manual masih disabled selama provinsi belum dipilih — fokus ke
    // tombol aktif pertama di grupnya (pemilih provinsi), bukan ke elemen mati.
    if (el?.matches(":disabled")) {
      el = el.parentElement?.querySelector<HTMLElement>("button:not(:disabled)") ?? el;
    }
    if (el) {
      el.focus();
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };

  // Dari ringkasan kembali ke kartu peserta untuk memperbaiki isiannya. Yang difokuskan
  // kartunya, bukan isian pertama: di ponsel fokus ke input teks memunculkan keyboard,
  // padahal yang ingin diubah sering kali pilihan (ukuran jersey, kategori).
  // "Ubah" di ringkasan: kembali ke langkah 2 pada tiket yang dimaksud.
  const ubahPeserta = (_key: string, index: number) => {
    setPesertaAktif(index);
    pindahLangkah(2);
  };

  // ── Validasi per langkah ────────────────────────────────────────────────────
  // Tiap fungsi mengisi pesan galat di state dan mengembalikan id isian bermasalah (urut
  // dari atas). "Lanjut" hanya memeriksa langkahnya sendiri; "Bayar" memeriksa ketiganya.
  const periksaPemesan = (): string[] => {
    const next: Partial<Record<BuyerField, string>> = {};
    for (const field of URUTAN_BUYER) {
      const message = VALIDATOR_BUYER[field](buyer[field]);
      if (message) next[field] = message;
    }
    setBuyerErrors(next);
    return URUTAN_BUYER.filter((f) => next[f]).map((f) => `buyer-${f}`);
  };

  // `hanyaIndex`: periksa satu tiket saja (tombol "Lanjut" di langkah 2); tanpa argumen = semua tiket.
  const periksaPeserta = (hanyaIndex?: number): string[] => {
    const hasilPeserta: Record<string, Partial<Record<PesertaField, string>>> = {};
    const hasilTambahan: Record<string, Record<string, string | undefined>> = {};
    const identitasTerlihat = new Map<string, number>();
    const masalah: string[] = [];

    pesertaList.forEach((raw, index) => {
      const dicek = hanyaIndex === undefined || hanyaIndex === index;
      const p = efektif(raw);
      const errorsPeserta: Partial<Record<PesertaField, string>> = {};
      if (dicek) {
        for (const field of URUTAN_PESERTA) {
          const message = validasiPeserta(field, p[field], p);
          if (message) errorsPeserta[field] = message;
        }
      }
      // Dibandingkan dalam bentuk kunci (tanpa titik/strip/spasi), sama seperti server & core.
      const kunci = kunciIdentitas(p.nik);
      if (kunci) {
        const sebelumnya = identitasTerlihat.get(kunci);
        if (sebelumnya === undefined) {
          identitasTerlihat.set(kunci, index);
        } else if (dicek && !errorsPeserta.nik) {
          errorsPeserta.nik = `Nomor identitas ini sama dengan Peserta ${sebelumnya + 1}.`;
        }
      }
      if (!dicek) return;

      const errorsTambahan: Record<string, string | undefined> = {};
      for (const kolom of kolomTambahan) {
        const message = validasiKolomTambahan(kolom, raw.tambahan[kolom.name] ?? "");
        if (message) errorsTambahan[kolom.name] = message;
      }
      hasilPeserta[raw.key] = errorsPeserta;
      hasilTambahan[raw.key] = errorsTambahan;
      for (const f of URUTAN_PESERTA) if (errorsPeserta[f]) masalah.push(`peserta-${index}-${f}`);
      for (const kolom of kolomTambahan) if (errorsTambahan[kolom.name]) masalah.push(`peserta-${index}-x-${kolom.name}`);
    });

    setPesertaErrors((prev) => ({ ...prev, ...hasilPeserta }));
    setTambahanErrors((prev) => ({ ...prev, ...hasilTambahan }));
    return masalah;
  };

  // Tombol bayar sengaja TIDAK di-disable supaya alasan yang kurang bisa dijelaskan.
  const periksaPersetujuan = (): string[] => {
    const next = {
      health: isHealthyChecked ? undefined : "Pernyataan kondisi sehat wajib dicentang.",
      privacy: isConsentChecked ? undefined : "Persetujuan kebijakan privasi wajib dicentang.",
    };
    setConsentErrors(next);
    const masalah: string[] = [];
    if (next.health) masalah.push("healthDeclaration");
    if (next.privacy) masalah.push("privacyConsent");
    return masalah;
  };

  const langkahDariId = (id: string): LangkahForm => (id.startsWith("buyer-") ? 1 : id.startsWith("peserta-") ? 2 : 3);

  const gulirKeAtas = () =>
    window.setTimeout(() => {
      document.getElementById("atas-formulir")?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 60);

  // Pindah langkah, lalu (setelah langkah barunya tampil) fokus ke isian bermasalah atau
  // gulir ke atas formulir. Jeda singkat: isian di langkah lain belum bisa difokuskan
  // sebelum React selesai menampilkannya.
  const pindahLangkah = (n: LangkahForm, fokusId?: string) => {
    setLangkah(n);
    if (fokusId) window.setTimeout(() => focusField(fokusId), 60);
    else gulirKeAtas();
  };

  const tampilkanMasalah = (ids: string[]) => {
    // Isian bermasalah bisa ada di tiket lain: tampilkan tiket itu dulu.
    const cocok = /^peserta-(\d+)-/.exec(ids[0]);
    if (cocok) setPesertaAktif(Number(cocok[1]));
    pindahLangkah(langkahDariId(ids[0]), ids[0]);
  };

  const lanjut = () => {
    if (loading || isFormClosed) return;
    let masalah: string[] = [];
    if (langkah === 1) {
      masalah = periksaPemesan();
      if (masalah.length === 0) setPesertaAktif(0);
    } else if (langkah === 2) {
      // Satu tiket per layar: "Lanjut" memeriksa tiket ini lalu membuka tiket berikutnya;
      // setelah tiket terakhir, semua tiket diperiksa sebelum masuk ke ringkasan.
      if (pesertaAktif < pesertaList.length - 1) {
        masalah = periksaPeserta(pesertaAktif);
        if (masalah.length === 0) {
          setPesertaAktif(pesertaAktif + 1);
          gulirKeAtas();
          return;
        }
      } else {
        masalah = periksaPeserta();
      }
    }
    if (masalah.length > 0) {
      tampilkanMasalah(masalah);
      return;
    }
    if (langkah < 3) pindahLangkah((langkah + 1) as LangkahForm);
  };

  // Di langkah 2 pada tiket kedua dst., "Kembali" membuka tiket sebelumnya; selain itu langkah sebelumnya.
  const mundur = () => {
    if (langkah === 2 && pesertaAktif > 0) {
      setPesertaAktif(pesertaAktif - 1);
      gulirKeAtas();
    } else if (langkah > 1) {
      pindahLangkah((langkah - 1) as LangkahForm);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || isFormClosed) return;
    // Enter di langkah awal berarti "Lanjut", bukan "Bayar".
    if (langkah < 3) {
      lanjut();
      return;
    }

    // Periksa SEMUA langkah lagi (isian langkah awal bisa diubah lewat "Ubah" di ringkasan).
    const daftarMasalah = [...periksaPemesan(), ...periksaPeserta(), ...periksaPersetujuan()];
    if (daftarMasalah.length > 0) {
      tampilkanMasalah(daftarMasalah);
      return;
    }

    setStatus("submitting");
    let sedangDialihkan = false;

    const payloadInti = {
      eventCode: "smadarun",
      buyer: {
        nama: rapikanNama(buyer.nama),
        email: buyer.email.trim(),
        whatsapp: buyer.whatsapp.trim(),
      },
      participants: bangunPesertaPayload(pesanan, buyer, wilayahDropdown),
      // Persetujuan ikut dikirim dan divalidasi ulang di server, bukan cuma mengunci tombol.
      health_declaration: true,
      privacy_consent: true,

      // Dikirim hanya sebagai pencocokan silang; server & core menghitung ulang sendiri.
      subtotal,
      total_amount: totalAmount,
    };
    // Isi yang sama → kunci idempotensi yang sama (kirim ulang aman); isi berubah → kunci baru.
    const sesi = pilihSesiPengiriman(sesiPengiriman.current, JSON.stringify(payloadInti), buatIdSesi);
    sesiPengiriman.current = sesi;
    // Versi teks persetujuan yang SEDANG tampil di tab ini (bukan bagian sidik jari isi,
    // sama seperti core tidak menghitung field persetujuan sebagai isi pesanan).
    const payloadKirim = { ...payloadInti, sessionId: sesi.id, consent_policy_version: VERSI_PERSETUJUAN };

    const tampilkanBelumPasti = (pesan: string, kode?: string, ref?: string) =>
      setModal({ show: true, jenis: "belum-pasti", title: "Hasil Belum Dapat Dipastikan", message: pesan, kode, ref });

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), BATAS_TUNGGU_KLIEN_MS);
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: JSON.stringify(payloadKirim),
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      const teks = await response.text();
      const hasil = tafsirkanResponsDaftar(response.status, response.headers.get("content-type"), teks, window.location.origin);

      switch (hasil.jenis) {
        case "bayar":
          // Untuk halaman /daftar/status (localStorage peramban ini; token = kunci baca status).
          simpanPesananTerakhir({ kode: hasil.kode, statusToken: hasil.statusToken });
          // Tandai supaya blok `finally` TIDAK mengembalikan tombol ke keadaan diam
          // selagi browser berpindah ke halaman pembayaran.
          sedangDialihkan = true;
          setTautanBayar({ url: hasil.url, kode: hasil.kode });
          setTampilkanCadangan(false);
          setStatus("redirecting");
          window.setTimeout(() => setTampilkanCadangan(true), JEDA_TAUTAN_CADANGAN_MS);
          window.location.assign(hasil.url);
          return;
        case "lunas":
          simpanPesananTerakhir({ kode: hasil.kode, statusToken: hasil.statusToken });
          setModal({
            show: true,
            jenis: "berhasil",
            title: "Pesanan Sudah Lunas",
            message: `Pesanan ${hasil.kode} sudah tercatat lunas. Bukti pendaftaran dikirim ke email pemesan.`,
            kode: hasil.kode,
          });
          setBuyer({ nama: "", email: "", whatsapp: "" });
          setPesanan({ pesertaList: [pesertaBaru(keyPesertaBaru(), kategoriAwal)], pemesanKey: null });
          setLangkah(1);
          setPesertaAktif(0);
          sesiPengiriman.current = null;
          setPesertaErrors({});
          setBuyerErrors({});
          setIsHealthyChecked(false);
          setIsConsentChecked(false);
          setConsentErrors({});
          return;
        case "ditolak":
          // Core pasti tidak membuat tagihan BARU. Isian dipertahankan untuk diperbaiki.
          // Kode pesanan yang menyertai (mis. identitas sudah ada di pesanan pending pemesan
          // ini) ditampilkan dan diingat untuk halaman status.
          if (hasil.ulangSesi) sesiPengiriman.current = null;
          if (hasil.kode) simpanPesananTerakhir({ kode: hasil.kode });
          setModal({
            show: true,
            jenis: "gagal",
            title: "Pendaftaran Ditolak",
            message: hasil.pesan,
            kode: hasil.kode,
            ref: hasil.ref,
          });
          return;
        case "belum-pasti":
          if (hasil.kode) simpanPesananTerakhir({ kode: hasil.kode });
          tampilkanBelumPasti(hasil.pesan, hasil.kode, hasil.ref);
          return;
      }
    } catch {
      // Timeout browser atau sambungan putus: permintaan mungkin sudah sampai ke server.
      tampilkanBelumPasti(PESAN_BELUM_PASTI);
    } finally {
      window.clearTimeout(timer);
      if (!sedangDialihkan) setStatus("idle");
    }
  };

  // Ringkasan pesanan — dipakai dua kali: inline di langkah 3 (ponsel) & di kartu samping (desktop).
  // Tiap peserta menampilkan nama, kategori, dan ukuran jersey supaya bisa dicek ulang
  // sebelum membayar; isian yang belum diisi ditulis terang-terangan, bukan dikosongkan.
  const RincianBiaya = (
    <dl className="space-y-3 text-sm">
      {pesertaList.map((raw, index) => {
        const nama = efektif(raw).nama.trim();
        const kategori = KATEGORI_TIKET[raw.kategori];
        const biaya = biayaPeserta(raw);
        return (
          <Fragment key={raw.key}>
          <div className="flex justify-between gap-4 text-foreground-accent font-medium">
            <dt className="min-w-0">
              <span className="block truncate">{nama || `Peserta ${index + 1}`}</span>
              {/* Kekurangan isian ditulis kecil di baris kedua (bukan di baris nama, yang terpotong). */}
              <span className="block text-xs text-muted-foreground">
                {kategori?.label ?? "-"}
                {raw.size && ` · Jersey ${raw.size}`}
                {(!nama || !raw.size) && (
                  <span className="text-warning"> · belum: {[!nama && "nama", !raw.size && "jersey"].filter(Boolean).join(", ")}</span>
                )}
              </span>
            </dt>
            <dd className="shrink-0 text-right">
              <span className="block tabular-nums">{harga(hargaPeserta(raw))}</span>
              <button
                type="button"
                onClick={() => ubahPeserta(raw.key, index)}
                className="rounded text-xs font-semibold text-foreground underline underline-offset-4 hover:text-foreground-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Ubah<span className="sr-only"> data peserta {index + 1}</span>
              </button>
            </dd>
          </div>
          {biaya > 0 && (
            <div className="-mt-1.5 flex justify-between gap-4 text-xs text-muted-foreground">
              <dt>Tambahan ukuran {raw.size}</dt>
              <dd className="tabular-nums">{harga(biaya)}</dd>
            </div>
          )}
          </Fragment>
        );
      })}
      <div className="flex justify-between gap-4 border-t border-border pt-2.5 text-foreground-accent font-medium">
        <dt>
          {adminFeeLabel}
          {adminFee > 0 && (
            <span className="block text-xs text-muted-foreground">
              {harga(adminFee)} × {pesertaList.length} tiket
            </span>
          )}
        </dt>
        <dd className="tabular-nums">{harga(totalAdminFee)}</dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-border pt-4 text-base font-semibold text-foreground">
        <dt>Total Pembayaran</dt>
        <dd className="tabular-nums">{harga(totalAmount)}</dd>
      </div>
    </dl>
  );

  const labelStatus = status === "redirecting" ? "Mengalihkan ke pembayaran…" : "Memproses…";

  // Sebelum hidrasi selesai onSubmit belum terpasang, dan form tanpa method mengirim GET biasa:
  // nama/email/WhatsApp ikut ke URL & riwayat browser lalu halaman memuat ulang dengan isian kosong.
  // Selama belum siap tombol bertipe "button" (tampilannya tetap sama), jadi tidak ada submit native.
  const siap = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const kelasTombolUtama =
    "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-full bg-primary text-sm font-semibold text-on-primary transition-all hover:bg-primary-accent disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-card";

  const submitButton = (label: string, extraClass: string) => (
    <button
      type={siap ? "submit" : "button"}
      form="formDaftar"
      disabled={loading || isFormClosed}
      aria-busy={loading}
      className={`${kelasTombolUtama} ${extraClass}`}
    >
      <span>{loading ? labelStatus : label}</span>
      {loading && (
        <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" aria-hidden="true" />
      )}
    </button>
  );

  const tiketTerakhir = pesertaAktif >= pesertaList.length - 1;
  const labelMaju = (pendek: boolean) =>
    langkah === 1
      ? "Lanjut"
      : langkah === 2
        ? tiketTerakhir
          ? pendek
            ? "Tinjau"
            : "Tinjau pesanan"
          : "Lanjut"
        : pendek
          ? "Bayar"
          : "Bayar sekarang";

  // Tombol maju: "Lanjut" di langkah 1–2, "Bayar" di langkah 3. `pendek` untuk bar bawah ponsel.
  // `key` berbeda WAJIB: tanpa itu React memakai ulang elemen <button> yang sama, tipenya berubah
  // dari "button" ke "submit" di tengah klik "Lanjut" dari langkah 2, dan klik yang sama langsung
  // mengirim formulir di langkah 3 — kotak persetujuan langsung merah sebelum sempat dicentang.
  const tombolUtama = (pendek: boolean, extraClass: string) =>
    langkah === 3 ? (
      <Fragment key="bayar">{submitButton(labelMaju(pendek), extraClass)}</Fragment>
    ) : (
      <button key="lanjut" type="button" onClick={lanjut} disabled={loading} className={`${kelasTombolUtama} ${extraClass}`}>
        {labelMaju(pendek)}
      </button>
    );

  const hargaMin = Math.min(...KATEGORI_KEYS.map((k) => KATEGORI_TIKET[k].price));
  const hargaMaks = Math.max(...KATEGORI_KEYS.map((k) => KATEGORI_TIKET[k].price));
  // Harga satuan (rentang bila kategori berbeda harga), BUKAN total.
  const hargaSatuan = hargaMin === hargaMaks ? harga(hargaMin) : `${harga(hargaMin)} – ${harga(hargaMaks)}`;
  // Seperti kembar.in: total belum disebut sebelum langkah 2 dan sebelum tiap peserta memilih kategorinya —
  // angka total sebelum itu terbaca seperti kategori sudah ditentukan.
  const totalTertunda = langkah === 1 || pesertaList.some((p) => !p.kategori);

  // ── Pendaftaran belum dibuka: tidak ada formulir mati berisi kolom abu-abu. ─────────────
  if (isFormClosed) {
    return (
      <div className="registration-atmosphere relative min-h-screen px-5 pb-24 pt-28">
        <div aria-hidden="true" className="registration-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
            {comingSoon ? "Pendaftaran segera dibuka" : "Pendaftaran belum dibuka"}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-foreground-accent sm:text-base">
            {comingSoon
              ? "Pantau terus info resmi panitia."
              : opensAtLabel
                ? `Pendaftaran dijadwalkan dibuka pada ${opensAtLabel}.`
                : "Semua kategori tiket sedang tidak tersedia. Silakan cek kembali nanti."}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/" className={`${kelasTombolUtama} min-h-11 px-6`}>
              Kembali ke beranda
            </Link>
            <Link
              href="/daftar/status"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-strong px-6 text-sm font-semibold text-foreground transition hover:border-foreground-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Sudah daftar? Cek pesanan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const bagian = (n: LangkahForm) => (langkah === n ? "space-y-6" : "hidden");
  const kelasJudul = "text-lg font-semibold leading-tight tracking-tight text-foreground sm:text-xl";
  const kelasTombolBulat =
    "flex h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-card text-foreground transition hover:border-foreground-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

  // CATATAN: pembungkus di bawah sengaja TIDAK memakai overflow-hidden (lihat riwayat: membuat
  // elemen sticky berhenti menempel). Latar dekoratifnya absolute inset-0, jadi tidak perlu diklip.
  return (
    <div className="registration-atmosphere group/daftar relative min-h-screen px-5 pb-40 pt-28 lg:pb-24">
      <div
        aria-hidden="true"
        className="registration-grid pointer-events-none absolute inset-0 -z-10"
      />

      <div className="mx-auto w-full max-w-2xl lg:max-w-5xl">
        <h1 className="mb-7 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
          Daftar SMADARUN 2027
        </h1>

        {/* Seperti kembar.in: ringkasan event (flyer, keterangan, benefit) di kiri dan menempel saat
            digulir; di ponsel & tablet tampil di atas formulir. */}
        <div className="lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside className="mb-6 rounded-panel border border-border bg-card p-5 lg:sticky lg:top-28 lg:mb-0">
          {/* Satu flyer saja; belum ada file = tidak ada kotak kosong. Klik untuk memperbesar. */}
          {flyerPendaftaran.src && (
            <button
              type="button"
              onClick={() => setIsFlyerOpen(true)}
              aria-label={`Perbesar: ${flyerPendaftaran.alt ?? flyerPendaftaran.title}`}
              className="mb-5 block w-full cursor-zoom-in overflow-hidden rounded-field bg-logo-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <Image
                src={flyerPendaftaran.src}
                alt=""
                width={flyerPendaftaran.width ?? 1080}
                height={flyerPendaftaran.height ?? 1350}
                sizes="(max-width: 1024px) 90vw, 352px"
                priority
                className="mx-auto block h-auto max-h-[28rem] w-auto max-w-full mix-blend-multiply lg:max-h-[min(24rem,calc(100dvh-24rem))]"
              />
            </button>
          )}
          <dl className="space-y-1.5 text-sm">
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 text-muted-foreground">Tanggal</dt>
              <dd className="font-medium text-foreground">{tanggalEvent ?? "Segera diumumkan"}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 text-muted-foreground">Lokasi</dt>
              <dd className="min-w-0 font-medium text-foreground">{lokasi ?? "Segera diumumkan"}</dd>
            </div>
            {KATEGORI_KEYS.length > 0 && (
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-muted-foreground">Harga</dt>
                <dd className="font-medium tabular-nums text-foreground">{hargaSatuan} / tiket</dd>
              </div>
            )}
          </dl>
          {fasilitasSemuaKategori.length > 0 && (
            <p className="mt-4 text-xs leading-relaxed text-foreground-accent">
              <span className="text-muted-foreground">Termasuk </span>
              {fasilitasSemuaKategori.join(" · ")}
            </p>
          )}
        </aside>

        <form
          id="formDaftar"
          onSubmit={handleSubmit}
          noValidate
          className="min-w-0 rounded-panel border border-border bg-card p-5 sm:p-8"
        >
          <div id="atas-formulir" className="scroll-mt-24">
            <StepNav langkah={langkah} onPilih={(n) => pindahLangkah(n)} />
          </div>

          <div className="mt-8">
            {/* LANGKAH 1 — TIKET & PEMESAN */}
            <section className={bagian(1)} aria-label="Tiket dan pemesan">
              {multiTicketEnabled && batasTiket > 1 && (
                <div className="flex items-center justify-between gap-5 rounded-card border border-border p-4 sm:px-5">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Jumlah tiket</p>
                    <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">
                      {hargaSatuan} per tiket · maks. {batasTiket}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Kurangi tiket"
                      disabled={pesertaList.length <= 1}
                      onClick={() => ubahJumlahTiket(pesertaList.length - 1)}
                      className={kelasTombolBulat}
                    >
                      <FiMinus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span className="min-w-8 text-center text-xl font-semibold tabular-nums text-foreground" aria-live="polite">
                      {pesertaList.length}
                    </span>
                    <button
                      type="button"
                      aria-label="Tambah tiket"
                      disabled={!bolehTambahPeserta}
                      onClick={() => ubahJumlahTiket(pesertaList.length + 1)}
                      className={kelasTombolBulat}
                    >
                      <FiPlus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <h2 className={kelasJudul}>Data pemesan</h2>
                <p className="mt-1 text-sm text-muted-foreground">Bukti pendaftaran dikirim ke email dan WhatsApp ini.</p>
              </div>
              <div>
                <label htmlFor="buyer-nama" className={labelClass}>Nama pemesan</label>
                <input
                  id="buyer-nama"
                  name="nama"
                  type="text"
                  autoComplete="name"
                  value={buyer.nama}
                  onChange={handleBuyerChange}
                  onBlur={handleBuyerBlur}
                  placeholder="Nama penanggung jawab pesanan"
                  aria-invalid={!!buyerErrors.nama}
                  aria-describedby={buyerErrors.nama ? "buyer-nama-error" : undefined}
                  className={fieldClass(!!buyerErrors.nama)}
                />
                <FieldError id="buyer-nama-error" message={buyerErrors.nama} />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="buyer-email" className={labelClass}>Email pemesan</label>
                  <input
                    id="buyer-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={buyer.email}
                    onChange={handleBuyerChange}
                    onBlur={handleBuyerBlur}
                    placeholder="nama@email.com"
                    aria-invalid={!!buyerErrors.email}
                    aria-describedby={buyerErrors.email ? "buyer-email-error" : undefined}
                    className={fieldClass(!!buyerErrors.email)}
                  />
                  <FieldError id="buyer-email-error" message={buyerErrors.email} />
                  {buyerErrors.email && suggestEmailCorrection(buyer.email) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Maksud Anda <span className="font-semibold text-foreground">{suggestEmailCorrection(buyer.email)}</span>?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          const email = suggestEmailCorrection(buyer.email) ?? buyer.email;
                          setBuyer((prev) => ({ ...prev, email }));
                          setBuyerErrors((prev) => ({ ...prev, email: undefined }));
                        }}
                        className="rounded font-semibold text-foreground underline underline-offset-4 hover:text-foreground-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        Pakai ini
                      </button>
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="buyer-whatsapp" className={labelClass}>WhatsApp pemesan</label>
                  <input
                    id="buyer-whatsapp"
                    name="whatsapp"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={buyer.whatsapp}
                    onChange={handleBuyerChange}
                    onBlur={handleBuyerBlur}
                    placeholder="081234567890"
                    aria-invalid={!!buyerErrors.whatsapp}
                    aria-describedby={buyerErrors.whatsapp ? "buyer-whatsapp-error" : undefined}
                    className={fieldClass(!!buyerErrors.whatsapp)}
                  />
                  <FieldError id="buyer-whatsapp-error" message={buyerErrors.whatsapp} />
                </div>
              </div>
            </section>

            {/* LANGKAH 2 — DATA PESERTA (satu tiket per layar, seperti di kembar.in) */}
            <section className={bagian(2)} aria-label="Data peserta">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className={kelasJudul}>Data peserta</h2>
                  {pesertaList.length > 1 && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tiket {pesertaAktif + 1} dari {pesertaList.length}
                    </p>
                  )}
                </div>
                {pesertaAktif === 0 && (
                  <button
                    type="button"
                    onClick={salinDataPemesan}
                    className="inline-flex min-h-10 items-center rounded-full border border-border-strong bg-card px-4 text-sm font-medium text-foreground transition hover:border-foreground-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    Gunakan data pemesan
                  </button>
                )}
              </div>

              {/* Pemilih tiket hanya bila tiketnya lebih dari satu. */}
              {pesertaList.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="group" aria-label="Pilih tiket">
                  {pesertaList.map((raw, index) => {
                    const nama = efektif(raw).nama.trim();
                    return (
                      <button
                        key={raw.key}
                        type="button"
                        aria-current={index === pesertaAktif ? "true" : undefined}
                        onClick={() => setPesertaAktif(index)}
                        className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                          index === pesertaAktif
                            ? "border-primary-accent bg-primary/10 font-medium text-foreground"
                            : "border-border-strong text-foreground-accent hover:border-foreground-accent"
                        }`}
                      >
                        <span className="tabular-nums text-muted-foreground">{index + 1}</span>
                        <span className="max-w-28 truncate">{nama.split(" ")[0] || "Tiket"}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {pesertaList.map((raw, index) => {
                const p = efektif(raw);
                const errs = pesertaErrors[raw.key] || {};

                return (
                  <div
                    key={raw.key}
                    id={`kartu-peserta-${index}`}
                    className={index === pesertaAktif ? "space-y-5" : "hidden"}
                  >
                    <div>
                      <label htmlFor={`peserta-${index}-nama`} className={labelClass}>Nama lengkap</label>
                      <input
                        id={`peserta-${index}-nama`}
                        type="text"
                        value={p.nama}
                        onChange={(e) => handlePesertaChange(raw.key, "nama", e.target.value)}
                        onBlur={(e) => handlePesertaBlur(raw.key, "nama", e.target.value)}
                        placeholder="Sesuai KTP atau Kartu Pelajar"
                        aria-invalid={!!errs.nama}
                        aria-describedby={errs.nama ? `peserta-${index}-nama-error` : undefined}
                        className={fieldClass(!!errs.nama)}
                      />
                      <FieldError id={`peserta-${index}-nama-error`} message={errs.nama} />
                    </div>

                    {/* Nama BIB hanya bila dipasang panitia di kembarin-v2. */}
                    {namaBib && (
                      <div>
                        <label htmlFor={`peserta-${index}-namaBib`} className={labelClass}>
                          {namaBib.label} <span className="font-normal text-muted-foreground">(opsional)</span>
                        </label>
                        <input
                          id={`peserta-${index}-namaBib`}
                          type="text"
                          maxLength={namaBib.maxLength}
                          autoComplete="off"
                          value={p.namaBib}
                          onChange={(e) => handlePesertaChange(raw.key, "namaBib", lipatKetikanNamaBib(e.target.value))}
                          onBlur={(e) => handlePesertaBlur(raw.key, "namaBib", e.target.value)}
                          placeholder="Kosong = memakai nama lengkap"
                          aria-invalid={!!errs.namaBib}
                          aria-describedby={errs.namaBib ? `peserta-${index}-namaBib-error` : `peserta-${index}-namaBib-hint`}
                          className={fieldClass(!!errs.namaBib)}
                        />
                        {errs.namaBib ? (
                          <FieldError id={`peserta-${index}-namaBib-error`} message={errs.namaBib} />
                        ) : (
                          <p id={`peserta-${index}-namaBib-hint`} className="mt-1.5 text-xs text-muted-foreground">
                            Dicetak di BIB, maks. {namaBib.maxLength} karakter. Tidak bisa diubah setelah mendaftar.
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <p id={`peserta-${index}-jenis-label`} className={labelClass}>Nomor identitas</p>
                      <div
                        role="radiogroup"
                        aria-labelledby={`peserta-${index}-jenis-label`}
                        className="mb-2.5 grid grid-cols-2 gap-2"
                      >
                        {(Object.keys(LABEL_JENIS_IDENTITAS) as JenisIdentitas[]).map((jenis) => (
                          <label key={jenis} className="cursor-pointer">
                            <input
                              type="radio"
                              name={`${raw.key}-jenis-identitas`}
                              value={jenis}
                              checked={p.jenisIdentitas === jenis}
                              onChange={() => gantiJenisIdentitas(raw.key, jenis)}
                              className="peer sr-only"
                            />
                            <span className={kelasPilihan(false)}>{LABEL_JENIS_IDENTITAS[jenis]}</span>
                          </label>
                        ))}
                      </div>
                      <input
                        id={`peserta-${index}-nik`}
                        type="text"
                        inputMode={p.jenisIdentitas === "nik" ? "numeric" : "text"}
                        maxLength={NOMOR_IDENTITAS_MAX}
                        autoComplete="off"
                        value={p.nik}
                        onChange={(e) => handlePesertaChange(raw.key, "nik", e.target.value)}
                        onBlur={(e) => handlePesertaBlur(raw.key, "nik", e.target.value)}
                        placeholder={p.jenisIdentitas === "nik" ? "16 digit angka" : "Nomor di kartu pelajar"}
                        aria-labelledby={`peserta-${index}-jenis-label`}
                        aria-invalid={!!errs.nik}
                        aria-describedby={errs.nik ? `peserta-${index}-nik-error` : undefined}
                        className={fieldClass(!!errs.nik)}
                      />
                      <FieldError id={`peserta-${index}-nik-error`} message={errs.nik} />
                    </div>

                    <div>
                      <p id={`peserta-${index}-gender-label`} className={labelClass}>Jenis kelamin</p>
                      <div
                        id={`peserta-${index}-gender`}
                        role="radiogroup"
                        aria-labelledby={`peserta-${index}-gender-label`}
                        aria-invalid={!!errs.gender}
                        aria-describedby={errs.gender ? `peserta-${index}-gender-error` : undefined}
                        tabIndex={-1}
                        className="grid grid-cols-2 gap-2 focus:outline-none"
                      >
                        {["Laki-laki", "Perempuan"].map((g) => (
                          <label key={g} className="cursor-pointer">
                            <input
                              type="radio"
                              name={`${raw.key}-gender`}
                              value={g}
                              checked={p.gender === g}
                              onChange={() => handlePesertaChange(raw.key, "gender", g)}
                              className="peer sr-only"
                            />
                            <span className={kelasPilihan(!!errs.gender)}>{g}</span>
                          </label>
                        ))}
                      </div>
                      <FieldError id={`peserta-${index}-gender-error`} message={errs.gender} />
                    </div>

                    <div>
                      <label htmlFor={`peserta-${index}-wilayah`} className={labelClass}>Kota domisili</label>
                      {wilayahDropdown ? (
                        <WilayahSelect
                          id={`peserta-${index}-wilayah`}
                          value={p.wilayah}
                          onChange={(val) => {
                            handlePesertaChange(raw.key, "wilayah", val);
                            handlePesertaBlur(raw.key, "wilayah", val);
                          }}
                          invalid={!!errs.wilayah}
                          describedBy={errs.wilayah ? `peserta-${index}-wilayah-error` : undefined}
                        />
                      ) : (
                        <input
                          id={`peserta-${index}-wilayah`}
                          type="text"
                          autoComplete="address-level2"
                          value={p.wilayah.display}
                          onChange={(e) =>
                            handlePesertaChange(raw.key, "wilayah", { ...p.wilayah, display: e.target.value })
                          }
                          onBlur={(e) =>
                            handlePesertaBlur(raw.key, "wilayah", { ...p.wilayah, display: e.target.value })
                          }
                          placeholder="Contoh: Nganjuk"
                          aria-invalid={!!errs.wilayah}
                          aria-describedby={errs.wilayah ? `peserta-${index}-wilayah-error` : undefined}
                          className={fieldClass(!!errs.wilayah)}
                        />
                      )}
                      <FieldError id={`peserta-${index}-wilayah-error`} message={errs.wilayah} />
                    </div>

                    {/* Kategori selalu dipilih di langkah ini (harga baru dihitung sesudahnya), seperti di kembar.in. */}
                    {KATEGORI_KEYS.length > 0 && (
                      <div>
                        <label htmlFor={`peserta-${index}-kategori`} className={labelClass}>Kategori lomba</label>
                        <select
                          id={`peserta-${index}-kategori`}
                          value={p.kategori}
                          onChange={(e) => handlePesertaChange(raw.key, "kategori", e.target.value)}
                          onBlur={(e) => handlePesertaBlur(raw.key, "kategori", e.target.value)}
                          aria-invalid={!!errs.kategori}
                          aria-describedby={
                            errs.kategori
                              ? `peserta-${index}-kategori-error`
                              : p.kategori && isKategoriPelajar(p.kategori)
                                ? `peserta-${index}-kategori-hint`
                                : undefined
                          }
                          className={fieldClass(!!errs.kategori)}
                        >
                          {!p.kategori && <option value="">Pilih kategori</option>}
                          {KATEGORI_KEYS.map((key) => (
                            <option key={key} value={key}>
                              {KATEGORI_TIKET[key].label} — {harga(KATEGORI_TIKET[key].price)}
                            </option>
                          ))}
                        </select>
                        {errs.kategori ? (
                          <FieldError id={`peserta-${index}-kategori-error`} message={errs.kategori} />
                        ) : p.kategori && isKategoriPelajar(p.kategori) ? (
                          <p id={`peserta-${index}-kategori-hint`} className="mt-1.5 text-xs text-muted-foreground">
                            Bawa kartu pelajar saat mengambil racepack.
                          </p>
                        ) : null}
                      </div>
                    )}

                    <div>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <p id={`peserta-${index}-size-label`} className="text-sm font-medium text-foreground">
                          Ukuran jersey
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsImgOpen(true)}
                          className="rounded text-xs font-semibold text-foreground underline underline-offset-4 hover:text-foreground-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        >
                          Lihat size chart
                        </button>
                      </div>
                      <div
                        id={`peserta-${index}-size`}
                        role="radiogroup"
                        aria-labelledby={`peserta-${index}-size-label`}
                        aria-invalid={!!errs.size}
                        aria-describedby={errs.size ? `peserta-${index}-size-error` : undefined}
                        tabIndex={-1}
                        className="grid grid-cols-4 gap-2 focus:outline-none sm:grid-cols-[repeat(auto-fit,minmax(4rem,1fr))]"
                      >
                        {daftarUkuran.map((s) => (
                          <label key={s} className="cursor-pointer">
                            <input
                              type="radio"
                              name={`${raw.key}-size`}
                              value={s}
                              checked={p.size === s}
                              onChange={() => handlePesertaChange(raw.key, "size", s)}
                              className="peer sr-only"
                            />
                            <span className={`${kelasPilihan(!!errs.size)} flex-col gap-0 leading-tight`}>
                              {s}
                              {biayaUkuran(ukuranJersey, s) > 0 && (
                                <>
                                  <span aria-hidden="true" className="text-[11px] font-semibold tabular-nums opacity-80">
                                    {biayaRingkas(biayaUkuran(ukuranJersey, s))}
                                  </span>
                                  <span className="sr-only"> tambahan {rupiah(biayaUkuran(ukuranJersey, s))}</span>
                                </>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                      <FieldError id={`peserta-${index}-size-error`} message={errs.size} />
                    </div>

                    {/* Kolom tambahan dari form builder kembarin-v2 — muncul otomatis tanpa coding di sini. */}
                    {kolomTambahan.map((kolom) => {
                      const id = `peserta-${index}-x-${kolom.name}`;
                      const nilai = raw.tambahan[kolom.name] ?? "";
                      const pesan = tambahanErrors[raw.key]?.[kolom.name];
                      const umum = {
                        id,
                        "aria-invalid": !!pesan,
                        "aria-describedby": pesan ? `${id}-error` : undefined,
                        className: fieldClass(!!pesan),
                      };
                      return (
                        <div key={kolom.name}>
                          <label htmlFor={id} className={labelClass}>
                            {kolom.label}
                            {!kolom.required && <span className="font-normal text-muted-foreground"> (opsional)</span>}
                          </label>
                          {kolom.type === "select" ? (
                            <select
                              {...umum}
                              value={nilai}
                              onChange={(e) => ubahTambahan(raw.key, kolom, e.target.value)}
                              onBlur={(e) => blurTambahan(raw.key, kolom, e.target.value)}
                            >
                              <option value="">{kolom.placeholder || `Pilih ${kolom.label}`}</option>
                              {kolom.options.map((o) => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              {...umum}
                              type={kolom.type === "birthdate" ? "date" : kolom.type === "tel" ? "tel" : kolom.type === "email" ? "email" : "text"}
                              inputMode={kolom.type === "tel" ? "tel" : kolom.type === "number" ? "decimal" : undefined}
                              min={kolom.type === "birthdate" ? tanggalLahir.min : undefined}
                              max={kolom.type === "birthdate" ? tanggalLahir.max : undefined}
                              maxLength={kolom.type === "birthdate" ? undefined : kolom.maxLength}
                              autoComplete="off"
                              value={nilai}
                              onChange={(e) => ubahTambahan(raw.key, kolom, e.target.value)}
                              onBlur={(e) => blurTambahan(raw.key, kolom, e.target.value)}
                              placeholder={kolom.placeholder || undefined}
                            />
                          )}
                          <FieldError id={`${id}-error`} message={pesan} />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </section>

            {/* LANGKAH 3 — TINJAU & BAYAR */}
            <section className={bagian(3)} aria-label="Tinjau dan bayar">
              <div>
                <h2 className={kelasJudul}>Tinjau pesanan</h2>
                <p className="mt-1 text-sm text-muted-foreground">Periksa kembali data setiap peserta sebelum membayar.</p>
              </div>

              <div className="rounded-card border border-border p-5">{RincianBiaya}</div>

              <div className="space-y-3">
                <div
                  className={`flex items-start gap-3 rounded-card border p-4 ${
                    consentErrors.health ? "border-danger bg-danger-surface" : "border-border"
                  }`}
                >
                  <input
                    type="checkbox"
                    id="healthDeclaration"
                    checked={isHealthyChecked}
                    onChange={(e) => {
                      setIsHealthyChecked(e.target.checked);
                      if (e.target.checked) setConsentErrors((p) => ({ ...p, health: undefined }));
                    }}
                    aria-invalid={!!consentErrors.health}
                    aria-describedby={consentErrors.health ? "health-error" : undefined}
                    className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-border accent-primary"
                  />
                  <div>
                    <label htmlFor="healthDeclaration" className="cursor-pointer text-sm leading-relaxed text-foreground-accent">
                      Saya dan seluruh peserta dalam pesanan ini menyatakan sehat dan bertanggung jawab penuh atas
                      keselamatan masing-masing selama SMADARUN 2027.
                    </label>
                    <FieldError id="health-error" message={consentErrors.health} />
                  </div>
                </div>

                <div
                  className={`flex items-start gap-3 rounded-card border p-4 ${
                    consentErrors.privacy ? "border-danger bg-danger-surface" : "border-border"
                  }`}
                >
                  <input
                    type="checkbox"
                    id="privacyConsent"
                    checked={isConsentChecked}
                    onChange={(e) => {
                      setIsConsentChecked(e.target.checked);
                      if (e.target.checked) setConsentErrors((p) => ({ ...p, privacy: undefined }));
                    }}
                    aria-invalid={!!consentErrors.privacy}
                    aria-describedby={consentErrors.privacy ? "privacy-error" : undefined}
                    className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-border accent-primary"
                  />
                  <div>
                    <label htmlFor="privacyConsent" className="cursor-pointer text-sm leading-relaxed text-foreground-accent">
                      Saya menyetujui Kebijakan Privasi atas data pribadi seluruh peserta yang saya daftarkan.
                    </label>
                    {/* Dialog di halaman yang sama — dulu kebijakan hanya bisa dibuka dari footer. */}
                    <button
                      type="button"
                      onClick={() => setIsPrivasiOpen(true)}
                      className="mt-1.5 block rounded text-xs font-semibold text-foreground underline underline-offset-4 hover:text-foreground-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      Baca Kebijakan Privasi
                    </button>
                    <FieldError id="privacy-error" message={consentErrors.privacy} />
                  </div>
                </div>
              </div>

            </section>
          </div>


          {/* Navigasi. Di ponsel tombol maju ada di bar bawah; di desktop di sini, bersama total. */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
            {langkah > 1 ? (
              <button
                type="button"
                onClick={mundur}
                disabled={loading}
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-foreground-accent transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
                Kembali
              </button>
            ) : (
              <span />
            )}
            <div className="hidden items-center gap-5 lg:flex">
              <p className="text-right text-sm text-muted-foreground">
                Total · {pesertaList.length} tiket
                {totalTertunda ? (
                  <span className="block text-sm font-medium text-muted-foreground">Pilih kategori</span>
                ) : (
                  <span className="block text-base font-semibold tabular-nums text-foreground">{harga(totalAmount)}</span>
                )}
              </p>
              {tombolUtama(false, "min-h-12 px-8")}
            </div>
          </div>
          <p className="mt-3 hidden text-right text-[11px] leading-relaxed text-muted-foreground lg:block">
            Pembayaran diproses oleh <a href="https://kembar.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">PT KEMBAR INOVASI INDONESIA</a>. Kamu akan diarahkan ke halaman pembayaran resmi.
          </p>
        </form>
        </div>
      </div>

      {/* Bar aksi sticky (ponsel & tablet): total di kiri, tombol maju di kanan. Disembunyikan selama
          dropdown wilayah terbuka: di browser yang mengecilkan halaman saat keyboard muncul, bar ini
          naik ke atas keyboard dan menutup daftar pilihan. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md group-has-[[role=listbox]]/daftar:hidden lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-4 px-5 py-3 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">
              Total · {pesertaList.length} tiket
            </div>
            {totalTertunda ? (
              <div className="whitespace-nowrap text-sm font-medium leading-tight text-muted-foreground">Pilih kategori</div>
            ) : (
              <div className="text-lg font-semibold leading-none tracking-tight text-foreground tabular-nums">
                {harga(totalAmount)}
              </div>
            )}
          </div>
          <div className="ml-auto flex w-36 shrink-0 flex-col items-center gap-1.5 sm:w-44">
            <div className="w-full">{tombolUtama(true, "min-h-11 w-full px-5")}</div>
            <div className="text-center text-[9px] leading-tight text-muted-foreground">
              Powered by <a href="https://kembar.in" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-foreground">PT KEMBAR INOVASI INDONESIA</a>
            </div>
          </div>
        </div>
      </div>

      {/*
         Lapisan status pengiriman. Sebelumnya satu-satunya tanda bahwa tombol sudah
         ditekan hanyalah teks kecil di dalam tombol itu sendiri — kalau pengguna
         menggulir sedikit saja, halaman tampak tidak melakukan apa-apa. Lapisan ini
         sekaligus mencegah isian diubah selagi permintaan berjalan.
      */}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-6 backdrop-blur-sm"
        >
          <div className="w-full max-w-xs rounded-card border border-border bg-card p-6 text-center shadow-hover">
            <span
              className="mx-auto mb-4 block h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary-accent"
              aria-hidden="true"
            />
            <p className="font-display text-lg font-bold text-foreground">
              {status === "redirecting" ? "Mengalihkan ke pembayaran" : "Mengirim data pendaftaran"}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {status === "redirecting"
                ? <>Anda sedang dibawa ke halaman pembayaran resmi <a href="https://kembar.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">PT KEMBAR INOVASI INDONESIA</a>. Jangan tutup halaman ini.</>
                : "Mohon tunggu sebentar dan jangan tutup halaman ini."}
            </p>
            {/* Pengalihan bisa tertahan (pemblokir, koneksi lambat). Pesanan sudah ada,
                jadi tautan yang SAMA ditawarkan — bukan ajakan mendaftar ulang. */}
            {status === "redirecting" && tampilkanCadangan && tautanBayar && (
              <div className="mt-4 border-t border-border pt-4 text-left">
                <p className="text-xs text-foreground-accent">
                  Belum berpindah? Pesanan <span className="font-mono font-semibold text-foreground">{tautanBayar.kode}</span> sudah dibuat.
                </p>
                <a
                  href={tautanBayar.url}
                  rel="noopener noreferrer"
                  className="mt-3 block w-full rounded-full bg-primary px-5 py-2.5 text-center text-sm font-bold text-on-primary transition hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  Buka halaman pembayaran
                </a>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-2 w-full rounded-full px-5 py-2 text-xs font-semibold text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  Kembali ke formulir
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flyer utama diperbesar */}
      {flyerPendaftaran.src && (
        <Dialog open={isFlyerOpen} onClose={() => setIsFlyerOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-overlay backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="relative w-full max-w-2xl">
              <DialogTitle className="sr-only">{flyerPendaftaran.title}</DialogTitle>
              <button
                onClick={() => setIsFlyerOpen(false)}
                className="absolute -top-11 right-0 rounded-full px-3 text-3xl font-bold text-on-secondary/80 transition hover:text-on-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span aria-hidden="true">&times;</span>
                <span className="sr-only">Tutup</span>
              </button>
              <Image
                src={flyerPendaftaran.src}
                alt={flyerPendaftaran.alt ?? flyerPendaftaran.title}
                width={flyerPendaftaran.width ?? 1080}
                height={flyerPendaftaran.height ?? 1350}
                className="max-h-[80vh] w-full rounded-card object-contain shadow-hover"
              />
            </DialogPanel>
          </div>
        </Dialog>
      )}

      {/* Lightbox panduan ukuran */}
      <Dialog open={isImgOpen} onClose={() => setIsImgOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-overlay backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="relative w-full max-w-2xl">
            <DialogTitle className="sr-only">Panduan Ukuran Jersey</DialogTitle>
            <button
              onClick={() => setIsImgOpen(false)}
              className="absolute -top-11 right-0 rounded-full px-3 text-3xl font-bold text-on-secondary/80 transition hover:text-on-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span aria-hidden="true">&times;</span>
              <span className="sr-only">Tutup</span>
            </button>
            <Image
              src={imageSrc}
              alt="Tabel panduan ukuran jersey: panjang dan lebar dalam cm per ukuran. XXL dan XXXL dikenakan tambahan Rp10.000 per jersey."
              width={2000}
              height={1560}
              className="max-h-[80vh] w-full rounded-card object-contain shadow-hover"
            />
          </DialogPanel>
        </div>
      </Dialog>

      {/* Kebijakan Privasi, dibuka dari kotak persetujuan tanpa meninggalkan formulir */}
      <Dialog open={isPrivasiOpen} onClose={() => setIsPrivasiOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-overlay backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-lg rounded-card border border-border bg-card p-6 text-foreground shadow-hover md:p-8">
            <DialogTitle className="mb-4 text-xl font-bold text-foreground sm:text-2xl">Kebijakan Privasi</DialogTitle>
            <IsiKebijakanPrivasi />
            <button
              type="button"
              onClick={() => setIsPrivasiOpen(false)}
              className="mt-6 w-full rounded-full bg-secondary py-2.5 text-sm font-bold text-on-secondary transition hover:bg-secondary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              Kembali ke formulir
            </button>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Modal hasil pendaftaran */}
      <Dialog
        open={modal.show}
        onClose={() => setModal((prev) => ({ ...prev, show: false }))}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-overlay backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-sm rounded-card border border-border bg-card p-8 text-center shadow-hover">
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${
                modal.jenis === "berhasil"
                  ? "bg-success-surface text-success"
                  : modal.jenis === "belum-pasti"
                    ? "bg-warning-surface text-warning"
                    : "bg-danger-surface text-danger"
              }`}
              aria-hidden="true"
            >
              {modal.jenis === "berhasil" ? "✓" : modal.jenis === "belum-pasti" ? "!" : "✕"}
            </div>
            <DialogTitle className="mb-2 font-display text-xl font-bold text-foreground">{modal.title}</DialogTitle>
            <p className="mb-4 text-sm leading-relaxed text-foreground-accent">{modal.message}</p>
            {(modal.kode || modal.ref) && (
              <dl className="mb-6 space-y-1 rounded-field border border-border bg-surface-sunken px-4 py-3 text-left text-xs">
                {modal.kode && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Kode pesanan</dt>
                    <dd className="font-mono font-semibold text-foreground">{modal.kode}</dd>
                  </div>
                )}
                {modal.ref && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Kode rujukan</dt>
                    <dd className="truncate font-mono text-foreground-accent">{modal.ref}</dd>
                  </div>
                )}
              </dl>
            )}
            <div className="flex flex-col gap-2">
              {(modal.jenis !== "gagal" || modal.kode) && (
                <Link
                  href="/daftar/status"
                  className="w-full rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  {modal.jenis === "berhasil" ? "Lihat ringkasan pembayaran" : "Cara memeriksa pesanan"}
                </Link>
              )}
              <button
                onClick={() => setModal((prev) => ({ ...prev, show: false }))}
                className="w-full rounded-full bg-secondary px-6 py-2.5 text-sm font-bold text-on-secondary transition hover:bg-secondary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                {modal.jenis === "berhasil" ? "Tutup" : "Kembali ke formulir"}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
