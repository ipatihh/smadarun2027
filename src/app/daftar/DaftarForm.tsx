"use client";

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore, ChangeEvent, FocusEvent, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import WilayahSelect, { WilayahValue, createEmptyWilayah } from "@/components/WilayahSelect";
import IsiKebijakanPrivasi from "@/components/legal/IsiKebijakanPrivasi";
import { KOTA_MANUAL_MAX_LENGTH, KOTA_MANUAL_PATTERN } from "@/lib/wilayah";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { tiketMarketing } from "@/data/tiket";
import { LiveTicketType } from "@/lib/kembarinEvents";
import { KolomNamaBib, lipatKetikanNamaBib, validasiNamaBib } from "@/lib/namaBib";
import { batasTanggalLahir, KolomTambahan, validasiKolomTambahan } from "@/lib/kolomTambahan";
import {
  JenisIdentitas,
  kunciIdentitas,
  LABEL_JENIS_IDENTITAS,
  NOMOR_IDENTITAS_MAX,
  validasiIdentitas,
} from "@/lib/identitas";
import { PESAN_BELUM_PASTI, tafsirkanResponsDaftar } from "@/lib/kontrakPendaftaran";
import { VERSI_PERSETUJUAN } from "@/lib/persetujuan";
import { simpanPesananTerakhir } from "@/lib/statusPesanan";
import {
  aturPemesanIkut,
  bangunPesertaPayload,
  buatIdSesi,
  dataPesertaEfektif,
  hapusPeserta as hapusPesertaDariPesanan,
  KeadaanPesanan,
  PemesanForm,
  pemesanIkutLari,
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
  const t = v.trim();
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
  // Biaya layanan/admin PER TIKET, live dari event_config.admin_fee_amount kembarin-v2
  // (lihat src/lib/kembarinEvents.ts) — bukan hardcode di sisi ini.
  adminFee: number;
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
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const fieldClass = (hasError: boolean) =>
  `min-h-12 w-full rounded-field border bg-card px-4 py-3 text-base text-foreground sm:text-sm outline-none transition placeholder:text-muted-foreground focus:ring-4 ${
    hasError
      ? "border-danger focus:border-danger focus:ring-danger/20"
      : "border-field-border focus:border-focus focus:ring-focus/15"
  }`;

const labelClass = "mb-2 block text-xs font-semibold text-foreground";

const FieldError: React.FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p id={id} role="alert" className="mt-1.5 text-xs font-semibold text-danger">
      {message}
    </p>
  ) : null;

const StepHeading: React.FC<{ step: number; title: string; hint?: string }> = ({ step, title, hint }) => (
  <div className="flex items-start gap-4">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-sunken text-xs font-semibold text-foreground">
      {String(step).padStart(2, "0")}
    </span>
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      {hint && <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  </div>
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
  adminFee,
  opensAtLabel,
  multiTicketEnabled,
  maxTicketsPerOrder,
  wilayahDropdown,
  namaBib,
  kolomTambahan,
}: DaftarFormProps) {
  const WEBHOOK_URL = "/api/daftar";
  const imageSrc = "/images/pocari-1.jpg";

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
  const PENDAFTARAN_DIBUKA = isOpen && KATEGORI_KEYS.length > 0;
  const isFormClosed = !PENDAFTARAN_DIBUKA;
  const batasTiket = Math.max(1, maxTicketsPerOrder);

  const [buyer, setBuyer] = useState<BuyerState>({ nama: "", email: "", whatsapp: "" });
  const [buyerErrors, setBuyerErrors] = useState<Partial<Record<BuyerField, string>>>({});

  // Peserta awal selalu `peserta-0` supaya render server dan browser identik. Peserta
  // berikutnya hanya dibuat di browser, nomornya dari ref milik komponen ini.
  const nomorKeyBerikut = useRef(1);
  const keyPesertaBaru = () => `peserta-${nomorKeyBerikut.current++}`;
  // Pemesan umumnya ikut lari juga (kasus paling sering), jadi awalnya dikaitkan ke
  // peserta pertama: nama/email/WhatsApp peserta itu mengikuti pemesan supaya tidak
  // diketik dua kali. Kaitannya lewat KEY peserta (pemesanKey), bukan indeks — lihat
  // src/lib/pesananPeserta.ts.
  const [pesanan, setPesanan] = useState<KeadaanPesanan>(() => ({
    pesertaList: [pesertaBaru("peserta-0", KATEGORI_KEYS[0] || "")],
    pemesanKey: "peserta-0",
  }));
  const pesertaList = pesanan.pesertaList;
  const pemesanIkut = pemesanIkutLari(pesanan);
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
  const [ringkasanError, setRingkasanError] = useState<{ jumlah: number; targetId: string } | null>(null);
  const [isImgOpen, setIsImgOpen] = useState(false);
  const [isPrivasiOpen, setIsPrivasiOpen] = useState(false);
  // Kartu peserta yang baru dituju dari tombol "Ubah" di ringkasan, disorot sebentar
  // supaya pengguna tahu sedang berada di kartu peserta yang mana.
  const [kartuDisorot, setKartuDisorot] = useState<string | null>(null);
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

  // Hanya peserta yang dikaitkan ke pemesan (pemesanKey) yang memakai identitas pemesan.
  const efektif = (p: PesertaState): PesertaState => dataPesertaEfektif(p, buyer, pesanan.pemesanKey);
  const pesertaPemesan = (p: PesertaState) => pesanan.pemesanKey !== null && p.key === pesanan.pemesanKey;

  const hargaPeserta = (p: PesertaState) => KATEGORI_TIKET[p.kategori]?.price ?? 0;

  const subtotal = pesertaList.reduce((sum, p) => sum + hargaPeserta(p), 0);
  // BIAYA LAYANAN DIHITUNG PER TIKET, bukan per pesanan — sama seperti calculateAdminFee()
  // di kembarin-v2 (feePerTicket * ticketCount). Pesanan 5 tiket = 5 x biaya layanan.
  const totalAdminFee = adminFee * pesertaList.length;
  const totalAmount = subtotal + totalAdminFee;

  const bolehTambahPeserta = multiTicketEnabled && pesertaList.length < batasTiket;

  const handleBuyerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBuyer((prev) => ({ ...prev, [name]: value }));
    setRingkasanError(null);
    if (buyerErrors[name as BuyerField]) {
      setBuyerErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBuyerBlur = (e: FocusEvent<HTMLInputElement>) => {
    const name = e.target.name as BuyerField;
    setBuyerErrors((prev) => ({ ...prev, [name]: VALIDATOR_BUYER[name](e.target.value) ?? undefined }));
  };

  const handlePesertaChange = (key: string, field: PesertaField, value: any) => {
    setPesertaList((prev) => prev.map((p) => (p.key === key ? { ...p, [field]: value } : p)));
    setRingkasanError(null);
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
    const message = validasiPeserta(field, value, peserta);
    setPesertaErrors((prev) => ({ ...prev, [key]: { ...prev[key], [field]: message ?? undefined } }));
  };

  // Ganti NIK <-> kartu pelajar. Isian yang sudah diketik dinilai ulang dengan aturan
  // jenis barunya, supaya pesan "harus 16 digit" tidak tertinggal setelah pindah jenis.
  const gantiJenisIdentitas = (key: string, jenis: JenisIdentitas) => {
    const peserta = pesertaList.find((p) => p.key === key);
    if (!peserta || peserta.jenisIdentitas === jenis) return;
    setPesertaList((prev) => prev.map((p) => (p.key === key ? { ...p, jenisIdentitas: jenis } : p)));
    setRingkasanError(null);
    const message = peserta.nik.trim() ? validasiIdentitas(jenis, peserta.nik) : null;
    setPesertaErrors((prev) => ({ ...prev, [key]: { ...prev[key], nik: message ?? undefined } }));
  };

  const tambahPeserta = () => {
    if (!bolehTambahPeserta) return;
    const baru = pesertaBaru(keyPesertaBaru(), KATEGORI_KEYS[0] || "");
    setPesanan((prev) => tambahPesertaKePesanan(prev, baru, batasTiket));
  };

  // Menghapus peserta pemesan MELEPAS kaitan pemesan (kotak "ikut lari" jadi tidak
  // tercentang); data peserta lain tidak ikut berubah.
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
      prev.map((p) => (p.key === key ? { ...p, tambahan: { ...p.tambahan, [kolom.name]: value } } : p))
    );
    setRingkasanError(null);
    if (tambahanErrors[key]?.[kolom.name]) {
      setTambahanErrors((prev) => ({ ...prev, [key]: { ...prev[key], [kolom.name]: undefined } }));
    }
  };

  const blurTambahan = (key: string, kolom: KolomTambahan, value: string) => {
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
  const ubahPeserta = (key: string, index: number) => {
    const kartu = document.getElementById(`kartu-peserta-${index}`);
    if (!kartu) return;
    kartu.focus({ preventScroll: true });
    kartu.scrollIntoView({ block: "start", behavior: "smooth" });
    setKartuDisorot(key);
    window.setTimeout(() => setKartuDisorot((k) => (k === key ? null : k)), 1600);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || isFormClosed) return;

    // 1) Validasi data pemesan
    const nextBuyerErrors: Partial<Record<BuyerField, string>> = {};
    for (const field of URUTAN_BUYER) {
      const message = VALIDATOR_BUYER[field](buyer[field]);
      if (message) nextBuyerErrors[field] = message;
    }
    setBuyerErrors(nextBuyerErrors);

    // 2) Validasi tiap peserta
    const nextPesertaErrors: Record<string, Partial<Record<PesertaField, string>>> = {};
    const nikTerpakai = new Map<string, number>();
    pesertaList.forEach((raw, index) => {
      const p = efektif(raw);
      const errorsPeserta: Partial<Record<PesertaField, string>> = {};
      for (const field of URUTAN_PESERTA) {
        // Nama/email/WA peserta pemesan mengikuti pemesan; kesalahannya sudah
        // dilaporkan di bagian pemesan, jangan dilaporkan dua kali.
        if (pesertaPemesan(raw) && (field === "nama" || field === "email" || field === "whatsapp")) continue;
        const message = validasiPeserta(field, p[field], p);
        if (message) errorsPeserta[field] = message;
      }
      // Dibandingkan dalam bentuk kunci (tanpa titik/strip/spasi), sama seperti server & core.
      const kunci = kunciIdentitas(p.nik);
      if (kunci && !errorsPeserta.nik) {
        const sebelumnya = nikTerpakai.get(kunci);
        if (sebelumnya !== undefined) {
          errorsPeserta.nik = `Nomor identitas ini sama dengan Peserta ${sebelumnya + 1}.`;
        } else {
          nikTerpakai.set(kunci, index);
        }
      }
      if (Object.keys(errorsPeserta).length > 0) nextPesertaErrors[raw.key] = errorsPeserta;
    });
    setPesertaErrors(nextPesertaErrors);

    const nextTambahanErrors: Record<string, Record<string, string>> = {};
    pesertaList.forEach((raw) => {
      for (const kolom of kolomTambahan) {
        const message = validasiKolomTambahan(kolom, raw.tambahan[kolom.name] ?? "");
        if (message) nextTambahanErrors[raw.key] = { ...nextTambahanErrors[raw.key], [kolom.name]: message };
      }
    });
    setTambahanErrors(nextTambahanErrors);

    // 3) Validasi persetujuan — tombol sengaja TIDAK di-disable supaya alasannya bisa dijelaskan.
    const nextConsentErrors = {
      health: isHealthyChecked ? undefined : "Pernyataan kondisi sehat wajib dicentang.",
      privacy: isConsentChecked ? undefined : "Persetujuan kebijakan privasi wajib dicentang.",
    };
    setConsentErrors(nextConsentErrors);

    // Kumpulkan SEMUA isian bermasalah lebih dulu, supaya bisa diberi tahu jumlahnya —
    // sebelumnya halaman hanya melompat ke field pertama tanpa satu kalimat penjelasan.
    const daftarMasalah: string[] = [];
    for (const f of URUTAN_BUYER) if (nextBuyerErrors[f]) daftarMasalah.push(`buyer-${f}`);
    pesertaList.forEach((p, index) => {
      const errorsPeserta = nextPesertaErrors[p.key];
      if (errorsPeserta) {
        for (const f of URUTAN_PESERTA) if (errorsPeserta[f]) daftarMasalah.push(`peserta-${index}-${f}`);
      }
      for (const kolom of kolomTambahan) {
        if (nextTambahanErrors[p.key]?.[kolom.name]) daftarMasalah.push(`peserta-${index}-x-${kolom.name}`);
      }
    });
    if (nextConsentErrors.health) daftarMasalah.push("healthDeclaration");
    if (nextConsentErrors.privacy) daftarMasalah.push("privacyConsent");

    if (daftarMasalah.length > 0) {
      setRingkasanError({ jumlah: daftarMasalah.length, targetId: daftarMasalah[0] });
      focusField(daftarMasalah[0]);
      return;
    }
    setRingkasanError(null);

    setStatus("submitting");
    let sedangDialihkan = false;

    const payloadInti = {
      eventCode: "smadarun",
      buyer: {
        nama: buyer.nama.trim(),
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
          {
            const keyAwal = keyPesertaBaru();
            setPesanan({ pesertaList: [pesertaBaru(keyAwal, KATEGORI_KEYS[0] || "")], pemesanKey: keyAwal });
          }
          sesiPengiriman.current = null;
          setPesertaErrors({});
          setBuyerErrors({});
          setIsHealthyChecked(false);
          setIsConsentChecked(false);
          setConsentErrors({});
          setRingkasanError(null);
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

  // Ringkasan kesalahan: menjelaskan APA yang terjadi saat tombol bayar ditekan tapi
  // formulir belum lengkap. Tanpa ini, halaman hanya melompat ke isian pertama dan
  // pengguna di bar bawah tidak tahu kenapa layarnya tiba-tiba berpindah.
  const KotakRingkasanError = ringkasanError ? (
    <div
      role="alert"
      className="rounded-field border border-danger bg-danger-surface p-4 text-left"
    >
      <p className="text-sm font-bold text-danger">
        {ringkasanError.jumlah} isian belum benar
      </p>
      <p className="mt-1 text-xs text-danger">
        Periksa bagian yang ditandai merah, lalu tekan Konfirmasi &amp; Bayar lagi.
      </p>
      <button
        type="button"
        onClick={() => focusField(ringkasanError.targetId)}
        className="mt-2 text-xs font-bold text-danger underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
      >
        Lompat ke isian pertama
      </button>
    </div>
  ) : null;

  // Ringkasan pesanan — dipakai dua kali: inline (mobile) & di kartu sticky (desktop).
  // Tiap peserta menampilkan nama, kategori, dan ukuran jersey supaya bisa dicek ulang
  // sebelum membayar; isian yang belum diisi ditulis terang-terangan, bukan dikosongkan.
  const RincianBiaya = (
    <dl className="space-y-3 text-sm">
      {pesertaList.map((raw, index) => {
        const nama = efektif(raw).nama.trim();
        const kategori = KATEGORI_TIKET[raw.kategori];
        return (
          <div key={raw.key} className="flex justify-between gap-4 text-foreground-accent font-medium">
            <dt className="min-w-0">
              <span className="block truncate">
                {nama || (
                  <>
                    Peserta {index + 1} <span className="text-warning">· nama belum diisi</span>
                  </>
                )}
              </span>
              <span className="block text-xs text-muted-foreground">
                {kategori?.label ?? "-"} ·{" "}
                {raw.size ? `Jersey ${raw.size}` : <span className="text-warning">jersey belum dipilih</span>}
              </span>
            </dt>
            <dd className="shrink-0 text-right">
              <span className="block tabular-nums">{rupiah(hargaPeserta(raw))}</span>
              <button
                type="button"
                onClick={() => ubahPeserta(raw.key, index)}
                className="rounded text-xs font-bold text-foreground underline underline-offset-4 hover:text-foreground-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Ubah<span className="sr-only"> data peserta {index + 1}</span>
              </button>
            </dd>
          </div>
        );
      })}
      <div className="flex justify-between gap-4 border-t border-border pt-2.5 text-foreground-accent font-medium">
        <dt>
          Biaya Layanan Platform
          <span className="block text-xs text-muted-foreground">
            {rupiah(adminFee)} × {pesertaList.length} tiket
          </span>
        </dt>
        <dd className="tabular-nums">{rupiah(totalAdminFee)}</dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-border pt-4 text-base font-semibold text-foreground">
        <dt>Total Pembayaran</dt>
        <dd className="tabular-nums">{rupiah(totalAmount)}</dd>
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

  const submitButton = (label = "Lanjut ke pembayaran", extraClass = "min-h-11 px-5") => (
    <button
      type={siap ? "submit" : "button"}
      form="formDaftar"
      disabled={loading || isFormClosed}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-full bg-primary text-sm font-semibold text-on-primary transition-all hover:bg-primary-accent disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-card ${extraClass}`}
    >
      <span>{loading ? labelStatus : label}</span>
      {loading && (
        <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" aria-hidden="true" />
      )}
    </button>
  );

  // CATATAN: pembungkus di bawah sengaja TIDAK memakai overflow-hidden. Elemen leluhur
  // dengan overflow selain "visible" membuat kartu ringkasan sticky berhenti menempel
  // saat halaman digulir. Latar dekoratifnya sudah absolute inset-0, jadi tidak perlu diklip.
  return (
    <div className="registration-atmosphere group/daftar relative min-h-screen px-5 pb-40 pt-28 lg:pb-24">
      <div
        aria-hidden="true"
        className="registration-grid pointer-events-none absolute inset-0 -z-10"
      />

      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground-accent sm:text-[13px]">
            <span className="h-px w-8 bg-primary-accent" aria-hidden="true" />
            SMADARUN 2027 / PENDAFTARAN
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
            Langkahmu dimulai di sini.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground-accent">
            Isi data pemesan dan peserta, lalu periksa ringkasan sebelum membayar.
          </p>
          <p className="mt-3 text-xs tracking-[0.02em] text-foreground-accent">
            Pembayaran online · Konfirmasi otomatis
          </p>
        </div>

        {isFormClosed && (
          <div className="mx-auto mb-6 max-w-2xl rounded-card border border-border bg-warning-surface p-4 text-center">
            <p className="text-sm font-bold text-warning">Pendaftaran belum dibuka</p>
            <p className="mt-1 text-xs text-warning">
              {opensAtLabel
                ? `Pendaftaran dijadwalkan dibuka pada ${opensAtLabel}. Sampai saat itu, formulir ini dinonaktifkan.`
                : "Semua kategori tiket sedang tidak tersedia. Silakan cek kembali nanti atau pantau info resmi panitia."}
            </p>
          </div>
        )}

        {/* grid-cols-1 (= minmax(0,1fr)) wajib di ponsel: tanpa itu kolomnya "auto" dan ikut
            melebar mengikuti isi yang tidak bisa patah (teks truncate, opsi <select>), sehingga
            kartu form meluber 7px ke kanan dan semua lapisan di dalamnya tidak center. */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* KOLOM FORM */}
          <form
            id="formDaftar"
            onSubmit={handleSubmit}
            noValidate
            className="rounded-panel border border-border bg-card p-5 sm:p-8 lg:p-10"
          >
            {/* min-w-0: bawaan browser fieldset adalah min-inline-size: min-content — sama seperti
                kolom grid di atas, tanpa ini fieldset ikut melebar dan meluber dari kartu form. */}
            <fieldset disabled={isFormClosed} className="min-w-0 space-y-10">
              {/* LANGKAH 1 — PEMESAN */}
              <section className="space-y-5">
                <StepHeading
                  step={1}
                  title="Data Pemesan"
                  hint="Penanggung jawab pesanan. Tautan pembayaran & bukti pendaftaran dikirim ke sini."
                />
                <div>
                  <label htmlFor="buyer-nama" className={labelClass}>Nama Pemesan</label>
                  <input
                    id="buyer-nama"
                    name="nama"
                    type="text"
                    autoComplete="name"
                    value={buyer.nama}
                    onChange={handleBuyerChange}
                    onBlur={handleBuyerBlur}
                    placeholder="Nama Lengkap"
                    aria-invalid={!!buyerErrors.nama}
                    aria-describedby={buyerErrors.nama ? "buyer-nama-error" : undefined}
                    className={fieldClass(!!buyerErrors.nama)}
                  />
                  <FieldError id="buyer-nama-error" message={buyerErrors.nama} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="buyer-email" className={labelClass}>Alamat Email</label>
                    <input
                      id="buyer-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={buyer.email}
                      onChange={handleBuyerChange}
                      onBlur={handleBuyerBlur}
                      placeholder="contoh@email.com"
                      aria-invalid={!!buyerErrors.email}
                      aria-describedby={buyerErrors.email ? "buyer-email-error" : undefined}
                      className={fieldClass(!!buyerErrors.email)}
                    />
                    <FieldError id="buyer-email-error" message={buyerErrors.email} />
                  </div>
                  <div>
                    <label htmlFor="buyer-whatsapp" className={labelClass}>Nomor WhatsApp</label>
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
                <div className="flex items-start gap-3 rounded-field border border-border bg-surface-sunken p-4">
                  <input
                    type="checkbox"
                    id="pemesanIkut"
                    checked={pemesanIkut}
                    onChange={(e) => setPesanan((prev) => aturPemesanIkut(prev, e.target.checked))}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-primary"
                  />
                  <label htmlFor="pemesanIkut" className="cursor-pointer text-xs font-medium leading-relaxed text-foreground-accent">
                    Saya (pemesan) juga ikut lari sebagai <span className="font-bold text-foreground">Peserta 1</span>.
                  </label>
                </div>
              </section>

              {/* LANGKAH 2 — PESERTA */}
              <section className="space-y-5 border-t border-border pt-9">
                <StepHeading
                  step={2}
                  title="Data Peserta"
                  hint={
                    multiTicketEnabled
                      ? `Satu pembayaran bisa untuk maksimal ${batasTiket} peserta. Tiap peserta boleh beda kategori & ukuran jersey.`
                      : "Isi data peserta sesuai identitas resmi — dipakai untuk verifikasi race pack."
                  }
                />

                {pesertaList.map((raw, index) => {
                  const p = efektif(raw);
                  const errs = pesertaErrors[raw.key] || {};
                  const identitasDariPemesan = pesertaPemesan(raw);

                  return (
                    <div
                      key={raw.key}
                      id={`kartu-peserta-${index}`}
                      tabIndex={-1}
                      className={`scroll-mt-28 rounded-card border bg-surface-sunken/55 p-5 transition-shadow duration-300 focus:outline-none sm:p-6 ${
                        kartuDisorot === raw.key ? "border-focus ring-4 ring-focus/15" : "border-border"
                      }`}
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          Peserta {index + 1}
                          {identitasDariPemesan && (
                            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-on-primary">
                              Pemesan
                            </span>
                          )}
                        </p>
                        {pesertaList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => hapusPeserta(raw.key)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground-accent transition hover:border-danger hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                          >
                            <FiTrash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Hapus
                            <span className="sr-only">peserta {index + 1}</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {identitasDariPemesan ? (
                          <p className="rounded-field border border-dashed border-border-strong bg-card px-4 py-3 text-xs text-muted-foreground">
                            Nama, email, dan WhatsApp mengikuti data pemesan di atas.
                          </p>
                        ) : (
                          <>
                            <div>
                              <label htmlFor={`peserta-${index}-nama`} className={labelClass}>Nama Lengkap</label>
                              <input
                                id={`peserta-${index}-nama`}
                                type="text"
                                value={p.nama}
                                onChange={(e) => handlePesertaChange(raw.key, "nama", e.target.value)}
                                onBlur={(e) => handlePesertaBlur(raw.key, "nama", e.target.value)}
                                placeholder="Sesuai KTP / Kartu Pelajar"
                                aria-invalid={!!errs.nama}
                                aria-describedby={errs.nama ? `peserta-${index}-nama-error` : undefined}
                                className={fieldClass(!!errs.nama)}
                              />
                              <FieldError id={`peserta-${index}-nama-error`} message={errs.nama} />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div>
                                <label htmlFor={`peserta-${index}-email`} className={labelClass}>
                                  Email <span className="font-medium normal-case tracking-normal text-muted-foreground">(opsional)</span>
                                </label>
                                <input
                                  id={`peserta-${index}-email`}
                                  type="email"
                                  value={p.email}
                                  onChange={(e) => handlePesertaChange(raw.key, "email", e.target.value)}
                                  onBlur={(e) => handlePesertaBlur(raw.key, "email", e.target.value)}
                                  placeholder="Kosongkan = pakai email pemesan"
                                  aria-invalid={!!errs.email}
                                  aria-describedby={errs.email ? `peserta-${index}-email-error` : undefined}
                                  className={fieldClass(!!errs.email)}
                                />
                                <FieldError id={`peserta-${index}-email-error`} message={errs.email} />
                              </div>
                              <div>
                                <label htmlFor={`peserta-${index}-whatsapp`} className={labelClass}>
                                  WhatsApp <span className="font-medium normal-case tracking-normal text-muted-foreground">(opsional)</span>
                                </label>
                                <input
                                  id={`peserta-${index}-whatsapp`}
                                  type="tel"
                                  inputMode="tel"
                                  value={p.whatsapp}
                                  onChange={(e) => handlePesertaChange(raw.key, "whatsapp", e.target.value)}
                                  onBlur={(e) => handlePesertaBlur(raw.key, "whatsapp", e.target.value)}
                                  placeholder="Kosongkan = pakai WA pemesan"
                                  aria-invalid={!!errs.whatsapp}
                                  aria-describedby={errs.whatsapp ? `peserta-${index}-whatsapp-error` : undefined}
                                  className={fieldClass(!!errs.whatsapp)}
                                />
                                <FieldError id={`peserta-${index}-whatsapp-error`} message={errs.whatsapp} />
                              </div>
                            </div>
                          </>
                        )}

                        {/* Nama BIB milik peserta sendiri, termasuk peserta yang memakai data pemesan. */}
                        {namaBib && (
                          <div>
                            <label htmlFor={`peserta-${index}-namaBib`} className={labelClass}>
                              {namaBib.label} <span className="font-medium normal-case tracking-normal text-muted-foreground">(opsional)</span>
                            </label>
                            <input
                              id={`peserta-${index}-namaBib`}
                              type="text"
                              maxLength={namaBib.maxLength}
                              autoComplete="off"
                              value={p.namaBib}
                              onChange={(e) => handlePesertaChange(raw.key, "namaBib", lipatKetikanNamaBib(e.target.value))}
                              onBlur={(e) => handlePesertaBlur(raw.key, "namaBib", e.target.value)}
                              placeholder="Kosongkan = pakai nama lengkap"
                              aria-invalid={!!errs.namaBib}
                              aria-describedby={errs.namaBib ? `peserta-${index}-namaBib-error` : `peserta-${index}-namaBib-hint`}
                              className={fieldClass(!!errs.namaBib)}
                            />
                            {errs.namaBib ? (
                              <FieldError id={`peserta-${index}-namaBib-error`} message={errs.namaBib} />
                            ) : (
                              <p id={`peserta-${index}-namaBib-hint`} className="mt-1.5 text-xs text-muted-foreground">
                                Dicetak di BIB, maksimal {namaBib.maxLength} karakter. Tidak bisa diubah setelah mendaftar.
                              </p>
                            )}
                          </div>
                        )}

                        <div>
                          {/* Tinggi pemilih jenis = tinggi baris label (20px), jadi jarak label–input sama dengan isian lain. */}
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                            <label htmlFor={`peserta-${index}-nik`} className="block text-sm font-semibold text-foreground">
                              Identitas
                            </label>
                            <div
                              role="radiogroup"
                              aria-label={`Jenis nomor identitas peserta ${index + 1}`}
                              className="flex rounded-full border border-border bg-card p-px"
                            >
                              {(Object.keys(LABEL_JENIS_IDENTITAS) as JenisIdentitas[]).map((jenis) => (
                                <label
                                  key={jenis}
                                  className="cursor-pointer rounded-full px-2.5 text-[11px] font-semibold leading-4 text-muted-foreground transition has-[:checked]:bg-primary has-[:checked]:text-on-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground"
                                >
                                  <input
                                    type="radio"
                                    name={`${raw.key}-jenis-identitas`}
                                    value={jenis}
                                    checked={p.jenisIdentitas === jenis}
                                    onChange={() => gantiJenisIdentitas(raw.key, jenis)}
                                    className="sr-only"
                                  />
                                  {LABEL_JENIS_IDENTITAS[jenis]}
                                </label>
                              ))}
                            </div>
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
                            aria-invalid={!!errs.nik}
                            aria-describedby={errs.nik ? `peserta-${index}-nik-error` : `peserta-${index}-nik-hint`}
                            className={fieldClass(!!errs.nik)}
                          />
                          {errs.nik ? (
                            <FieldError id={`peserta-${index}-nik-error`} message={errs.nik} />
                          ) : (
                            <p id={`peserta-${index}-nik-hint`} className="mt-1.5 text-xs text-muted-foreground">
                              {p.jenisIdentitas === "nik"
                                ? "Ada di KTP atau Kartu Keluarga."
                                : "NISN atau nomor induk, sesuai kartu pelajar."}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor={`peserta-${index}-gender`} className={labelClass}>Jenis Kelamin</label>
                            <select
                              id={`peserta-${index}-gender`}
                              value={p.gender}
                              onChange={(e) => handlePesertaChange(raw.key, "gender", e.target.value)}
                              onBlur={(e) => handlePesertaBlur(raw.key, "gender", e.target.value)}
                              aria-invalid={!!errs.gender}
                              aria-describedby={errs.gender ? `peserta-${index}-gender-error` : undefined}
                              className={fieldClass(!!errs.gender)}
                            >
                              <option value="" disabled>Pilih Jenis Kelamin</option>
                              <option value="Laki-laki">Laki-laki</option>
                              <option value="Perempuan">Perempuan</option>
                            </select>
                            <FieldError id={`peserta-${index}-gender-error`} message={errs.gender} />
                          </div>
                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <label htmlFor={`peserta-${index}-size`} className="block text-sm font-semibold text-foreground">Ukuran Jersey (Unisex)</label>
                              <button
                                type="button"
                                onClick={() => setIsImgOpen(true)}
                                className="text-xs font-bold text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded"
                              >
                                Lihat Size Chart
                              </button>
                            </div>
                            <select
                              id={`peserta-${index}-size`}
                              value={p.size}
                              onChange={(e) => handlePesertaChange(raw.key, "size", e.target.value)}
                              onBlur={(e) => handlePesertaBlur(raw.key, "size", e.target.value)}
                              aria-invalid={!!errs.size}
                              aria-describedby={errs.size ? `peserta-${index}-size-error` : undefined}
                              className={fieldClass(!!errs.size)}
                            >
                              <option value="" disabled>Pilih Ukuran</option>
                              {["XS", "S", "M", "L", "XL", "XXL", "XXXL"].map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <FieldError id={`peserta-${index}-size-error`} message={errs.size} />
                          </div>
                        </div>

                        {/* Domisili sengaja satu baris penuh: Provinsi & Kota masing-masing selebar satu
                            kolom grid di atasnya. Waktu masih berbagi baris dengan Ukuran Jersey, tiap
                            pilihan hanya ±119px di desktop — "Jawa Timur" pun terpotong. */}
                        <div>
                          <label htmlFor={`peserta-${index}-wilayah`} className={labelClass}>Kota Domisili</label>
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

                        {PENDAFTARAN_DIBUKA && (
                          <div>
                            <label htmlFor={`peserta-${index}-kategori`} className={labelClass}>Kategori Lomba</label>
                            <select
                              id={`peserta-${index}-kategori`}
                              value={p.kategori}
                              onChange={(e) => handlePesertaChange(raw.key, "kategori", e.target.value)}
                              onBlur={(e) => handlePesertaBlur(raw.key, "kategori", e.target.value)}
                              aria-invalid={!!errs.kategori}
                              aria-describedby={errs.kategori ? `peserta-${index}-kategori-error` : undefined}
                              className={fieldClass(!!errs.kategori)}
                            >
                              {Object.entries(KATEGORI_TIKET).map(([key, cat]) => (
                                <option key={key} value={key}>
                                  {cat.label} — {rupiah(cat.price)}
                                </option>
                              ))}
                            </select>
                            <FieldError id={`peserta-${index}-kategori-error`} message={errs.kategori} />
                          </div>
                        )}

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
                                {!kolom.required && (
                                  <span className="font-medium normal-case tracking-normal text-muted-foreground"> (opsional)</span>
                                )}
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
                    </div>
                  );
                })}

                {multiTicketEnabled && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={tambahPeserta}
                      disabled={!bolehTambahPeserta}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong bg-card px-5 text-sm font-semibold text-foreground transition hover:border-foreground-accent disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      <FiPlus className="h-4 w-4" aria-hidden="true" />
                      Tambah Peserta
                    </button>
                    <p className="text-xs text-muted-foreground" aria-live="polite">
                      {pesertaList.length} dari {batasTiket} tiket dalam pesanan ini
                    </p>
                  </div>
                )}


              </section>

              {/* LANGKAH 3 — KONFIRMASI */}
              <section className="space-y-5 border-t border-border pt-9">
                <StepHeading step={3} title="Konfirmasi & Bayar" hint="Periksa data peserta dan rincian biaya sebelum melanjutkan ke pembayaran." />

                {KotakRingkasanError}

                {/* Ringkasan inline — di desktop informasi yang sama tampil di kartu sticky. */}
                {PENDAFTARAN_DIBUKA && (
                  <div className="rounded-field border border-border bg-surface-sunken p-5 lg:hidden">
                    <p className="mb-3 text-sm font-semibold text-foreground">Ringkasan pesanan</p>
                    {RincianBiaya}
                  </div>
                )}

                <div
                  className={`flex items-start gap-3 rounded-field border p-4 ${
                    consentErrors.health ? "border-danger bg-danger-surface" : "border-border bg-surface-sunken"
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
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-primary"
                  />
                  <div>
                    <label htmlFor="healthDeclaration" className="cursor-pointer text-xs font-medium leading-relaxed text-foreground-accent">
                      Saya dan{" "}
                      <span className="font-bold text-foreground">seluruh peserta dalam pesanan ini</span> menyatakan{" "}
                      <span className="font-bold text-foreground">sehat dan bertanggung jawab penuh</span> atas
                      keselamatan masing-masing selama SMADARUN 2027.
                    </label>
                    <FieldError id="health-error" message={consentErrors.health} />
                  </div>
                </div>

                <div
                  className={`flex items-start gap-3 rounded-field border p-4 ${
                    consentErrors.privacy ? "border-danger bg-danger-surface" : "border-border bg-surface-sunken"
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
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-primary"
                  />
                  <div>
                    <label htmlFor="privacyConsent" className="cursor-pointer text-xs font-medium leading-relaxed text-foreground-accent">
                      Saya menyetujui{" "}
                      <span className="font-bold text-foreground">Kebijakan Privasi</span> atas data pribadi seluruh
                      peserta yang saya daftarkan.
                    </label>
                    {/* Dialog di halaman yang sama — dulu kebijakan hanya bisa dibuka dari footer. */}
                    <button
                      type="button"
                      onClick={() => setIsPrivasiOpen(true)}
                      className="mt-1 block rounded text-xs font-bold text-foreground underline underline-offset-4 hover:text-foreground-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      Baca Kebijakan Privasi
                    </button>
                    <FieldError id="privacy-error" message={consentErrors.privacy} />
                  </div>
                </div>
              </section>
            </fieldset>
          </form>

          {/* KOLOM RINGKASAN — sticky di desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-panel border border-border bg-card p-6">
              <div className="mb-4 flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">Ringkasan pesanan</p>
                {PENDAFTARAN_DIBUKA && (
                  <span className="text-xs font-bold text-foreground-accent">
                    {pesertaList.length} tiket
                  </span>
                )}
              </div>
              {PENDAFTARAN_DIBUKA ? (
                <>
                  {RincianBiaya}
                  {ringkasanError && <div className="mt-4">{KotakRingkasanError}</div>}
                  <div className="mt-6">{submitButton("Lanjut ke pembayaran", "min-h-11 w-full px-5")}</div>
                  <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                    Pembayaran diproses oleh <a href="https://kembar.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">PT KEMBAR INOVASI</a>. Anda akan diarahkan ke halaman pembayaran resmi.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Rincian biaya akan muncul setelah pendaftaran dibuka panitia.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Bar aksi sticky (mobile & tablet). Disembunyikan selama dropdown wilayah terbuka:
          di browser yang mengecilkan halaman saat keyboard muncul, bar ini naik ke atas
          keyboard dan menutup daftar pilihan. */}
      {PENDAFTARAN_DIBUKA && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md group-has-[[role=listbox]]/daftar:hidden lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-4 px-5 py-3 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">
                Total · {pesertaList.length} tiket
              </div>
              <div className="text-lg font-semibold leading-none tracking-tight text-foreground tabular-nums">
                {rupiah(totalAmount)}
              </div>
              {ringkasanError && (
                <div className="mt-1 text-[11px] font-bold text-danger">
                  {ringkasanError.jumlah} isian belum benar
                </div>
              )}
            </div>
            <div className="ml-auto flex w-36 shrink-0 flex-col items-center gap-1.5 sm:w-44">
              <div className="w-full">{submitButton("Bayar", "min-h-11 w-full px-5")}</div>
              <div className="text-center text-[9px] leading-tight text-muted-foreground">
                Powered by <a href="https://kembar.in" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-foreground">PT KEMBAR INOVASI</a>
              </div>
            </div>
          </div>
        </div>
      )}

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
                ? <>Anda sedang dibawa ke halaman pembayaran resmi <a href="https://kembar.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">PT KEMBAR INOVASI</a>. Jangan tutup halaman ini.</>
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
              alt="Tabel Panduan Ukuran Jersey diperbesar"
              width={1994}
              height={1387}
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
