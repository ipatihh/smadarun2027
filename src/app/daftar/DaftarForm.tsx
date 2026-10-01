"use client";

import React, { useMemo, useState, ChangeEvent, FocusEvent, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import WilayahSelect, { WilayahValue, createEmptyWilayah } from "@/components/WilayahSelect";
import { KOTA_MANUAL_MAX_LENGTH, KOTA_MANUAL_PATTERN } from "@/lib/wilayah";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { tiketMarketing } from "@/data/tiket";
import { LiveTicketType } from "@/lib/kembarinEvents";

interface BuyerState {
  nama: string;
  email: string;
  whatsapp: string;
}

interface PesertaState {
  key: string;
  nama: string;
  email: string;
  whatsapp: string;
  nik: string;
  gender: string;
  wilayah: WilayahValue;
  kategori: string;
  size: string;
}

type BuyerField = keyof BuyerState;
type PesertaField = Exclude<keyof PesertaState, "key">;

// Hanya domain resmi gateway pembayaran yang boleh dituju saat redirect otomatis ke halaman pembayaran.
// Mencegah open-redirect/phishing seandainya respons backend core suatu saat tidak sesuai ekspektasi.
const ALLOWED_PAYMENT_HOSTS = ["doku.com", "sandbox.doku.com", "checkout.doku.com", "midtrans.com", "sandbox.midtrans.com"];

function isTrustedPaymentUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_PAYMENT_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

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

const VALIDATOR_PESERTA: Record<PesertaField, (v: any) => string | null> = {
  nama: (v) => validasiNama(v, "Nama peserta"),
  email: (v) => validasiEmail(v, false),
  whatsapp: (v) => validasiWhatsapp(v, false),
  nik: (v) => {
    const t = v.trim();
    if (!t) return "NIK wajib diisi.";
    if (!/^\d{16}$/.test(t)) return `NIK harus 16 digit angka (sekarang ${t.length} karakter).`;
    return null;
  },
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
};

// Urutan ini menentukan field mana yang difokuskan lebih dulu saat submit gagal.
const URUTAN_BUYER: BuyerField[] = ["nama", "email", "whatsapp"];
const URUTAN_PESERTA: PesertaField[] = ["nama", "nik", "gender", "wilayah", "kategori", "size", "email", "whatsapp"];

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
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const fieldClass = (hasError: boolean) =>
  `w-full p-3.5 bg-surface-sunken border rounded-field text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-4 ${
    hasError
      ? "border-danger focus:border-danger focus:ring-danger/20"
      : "border-border focus:border-foreground focus:ring-primary/40"
  }`;

const labelClass = "block text-sm font-semibold text-foreground mb-2";

const FieldError: React.FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p id={id} role="alert" className="mt-1.5 text-xs font-semibold text-danger">
      {message}
    </p>
  ) : null;

const StepHeading: React.FC<{ step: number; title: string; hint?: string }> = ({ step, title, hint }) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-on-primary">
      {step}
    </span>
    <div>
      <h3 className="font-display text-xl font-bold text-foreground leading-none">{title}</h3>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  </div>
);

let pesertaCounter = 0;
const pesertaBaru = (kategoriDefault: string): PesertaState => ({
  key: `peserta-${++pesertaCounter}`,
  nama: "",
  email: "",
  whatsapp: "",
  nik: "",
  gender: "",
  wilayah: createEmptyWilayah(),
  kategori: kategoriDefault,
  size: "",
});

export default function DaftarForm({
  ticketTypes,
  isOpen,
  adminFee,
  opensAtLabel,
  multiTicketEnabled,
  maxTicketsPerOrder,
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

  // Pemesan umumnya ikut lari juga (kasus paling sering). Kalau dicentang, data
  // nama/email/WhatsApp peserta pertama mengikuti pemesan supaya tidak diketik dua kali.
  const [pemesanIkut, setPemesanIkut] = useState(true);

  const [pesertaList, setPesertaList] = useState<PesertaState[]>([pesertaBaru(KATEGORI_KEYS[0] || "")]);
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
  const [modal, setModal] = useState<{ show: boolean; success: boolean; title: string; message: string }>({
    show: false,
    success: false,
    title: "",
    message: "",
  });

  // Peserta pertama memakai identitas pemesan kalau kotaknya dicentang.
  const dataPesertaEfektif = (p: PesertaState, index: number): PesertaState =>
    index === 0 && pemesanIkut
      ? { ...p, nama: buyer.nama, email: buyer.email, whatsapp: buyer.whatsapp }
      : p;

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

  const handlePesertaBlur = (key: string, field: PesertaField, value: any) => {
    const message = VALIDATOR_PESERTA[field](value);
    setPesertaErrors((prev) => ({ ...prev, [key]: { ...prev[key], [field]: message ?? undefined } }));
  };

  const tambahPeserta = () => {
    if (!bolehTambahPeserta) return;
    setPesertaList((prev) => [...prev, pesertaBaru(KATEGORI_KEYS[0] || "")]);
  };

  const hapusPeserta = (key: string) => {
    setPesertaList((prev) => (prev.length <= 1 ? prev : prev.filter((p) => p.key !== key)));
    setPesertaErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
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
      const p = dataPesertaEfektif(raw, index);
      const errorsPeserta: Partial<Record<PesertaField, string>> = {};
      for (const field of URUTAN_PESERTA) {
        // Nama/email/WA peserta pertama mengikuti pemesan; kesalahannya sudah
        // dilaporkan di bagian pemesan, jangan dilaporkan dua kali.
        if (index === 0 && pemesanIkut && (field === "nama" || field === "email" || field === "whatsapp")) continue;
        const message = VALIDATOR_PESERTA[field](p[field]);
        if (message) errorsPeserta[field] = message;
      }
      const nik = p.nik.trim();
      if (nik && !errorsPeserta.nik) {
        const sebelumnya = nikTerpakai.get(nik);
        if (sebelumnya !== undefined) {
          errorsPeserta.nik = `NIK ini sama dengan Peserta ${sebelumnya + 1}.`;
        } else {
          nikTerpakai.set(nik, index);
        }
      }
      if (Object.keys(errorsPeserta).length > 0) nextPesertaErrors[raw.key] = errorsPeserta;
    });
    setPesertaErrors(nextPesertaErrors);

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
      if (!errorsPeserta) return;
      for (const f of URUTAN_PESERTA) if (errorsPeserta[f]) daftarMasalah.push(`peserta-${index}-${f}`);
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

    const payload = {
      eventCode: "smadarun",
      buyer: {
        nama: buyer.nama.trim(),
        email: buyer.email.trim(),
        whatsapp: buyer.whatsapp.trim(),
      },
      participants: pesertaList.map((raw, index) => {
        const p = dataPesertaEfektif(raw, index);
        return {
          nama: p.nama.trim(),
          email: p.email.trim(),
          whatsapp: p.whatsapp.trim(),
          nik: p.nik.trim(),
          gender: p.gender,
          // Kode wilayah ikut dikirim supaya core menyimpan provinsi & kabupaten/kota
          // resmi (prov_code/kota_code), bukan sekadar teks. Server menurunkan ulang
          // nama dari kode; `kota` hanya dipakai untuk isian manual.
          provCode: p.wilayah.provCode,
          kotaCode: p.wilayah.manual ? "" : p.wilayah.kotaCode,
          kota: p.wilayah.display.trim(),
          kategori: p.kategori,
          size: p.size,
        };
      }),
      paymentGateway: "midtrans",

      // Persetujuan ikut dikirim dan divalidasi ulang di server, bukan cuma mengunci tombol.
      health_declaration: true,
      privacy_consent: true,

      // Dikirim hanya sebagai pencocokan silang; server & core menghitung ulang sendiri.
      subtotal,
      total_amount: totalAmount,
    };

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          `Server mengembalikan respons tidak valid (HTTP ${response.status}). Silakan coba beberapa saat lagi.`
        );
      }

      const result = await response.json();

      if (response.ok && result.success !== false) {
        const paymentUrl =
          result.paymentUrl || result.payment_url || result.data?.paymentUrl || result.data?.payment_url;

        if (paymentUrl) {
          // Redirect hanya diizinkan ke domain resmi payment gateway untuk mencegah open-redirect/phishing.
          if (!isTrustedPaymentUrl(paymentUrl)) {
            throw new Error(
              "Tautan pembayaran yang diterima tidak valid. Pendaftaran dibatalkan demi keamanan Anda."
            );
          }
          // Tandai supaya blok `finally` TIDAK mengembalikan tombol ke keadaan diam
          // selagi browser berpindah ke halaman pembayaran.
          sedangDialihkan = true;
          setStatus("redirecting");
          window.location.href = paymentUrl;
          return;
        }

        setModal({
          show: true,
          success: true,
          title: "Pendaftaran Berhasil!",
          message:
            result.message ||
            "Data pendaftaran Anda telah aman tersimpan. Silakan periksa email Anda untuk rincian pembayaran.",
        });

        setBuyer({ nama: "", email: "", whatsapp: "" });
        setPesertaList([pesertaBaru(KATEGORI_KEYS[0] || "")]);
        setPesertaErrors({});
        setBuyerErrors({});
        setIsHealthyChecked(false);
        setIsConsentChecked(false);
        setConsentErrors({});
        setRingkasanError(null);
      } else {
        throw new Error(result.message || result.error || "Gagal memproses pendaftaran");
      }
    } catch (err: unknown) {
      setModal({
        show: true,
        success: false,
        title: "Pendaftaran Gagal",
        message:
          err instanceof Error
            ? err.message
            : "Gagal mengirim data pendaftaran. Silakan periksa koneksi Anda dan coba lagi.",
      });
    } finally {
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

  // Rincian biaya — dipakai dua kali: inline (mobile) & di kartu ringkasan sticky (desktop).
  const RincianBiaya = (
    <dl className="space-y-2.5 text-sm">
      {pesertaList.map((raw, index) => {
        const nama = dataPesertaEfektif(raw, index).nama.trim();
        const kategori = KATEGORI_TIKET[raw.kategori];
        return (
          <div key={raw.key} className="flex justify-between gap-4 text-foreground-accent font-medium">
            <dt className="min-w-0">
              <span className="block truncate">{nama || `Peserta ${index + 1}`}</span>
              <span className="text-xs text-muted-foreground">{kategori?.label ?? "-"}</span>
            </dt>
            <dd className="tabular-nums">{rupiah(hargaPeserta(raw))}</dd>
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
      <div className="flex justify-between gap-4 border-t border-border pt-2.5 font-black text-base text-foreground">
        <dt>Total Pembayaran</dt>
        <dd className="tabular-nums">{rupiah(totalAmount)}</dd>
      </div>
    </dl>
  );

  const labelStatus = status === "redirecting" ? "Mengalihkan ke pembayaran…" : "Memproses…";

  const submitButton = (label = "Konfirmasi & Bayar", extraClass = "py-4") => (
    <button
      type="submit"
      form="formDaftar"
      disabled={loading || isFormClosed}
      aria-busy={loading}
      className={`w-full bg-primary hover:bg-primary-accent text-on-primary font-bold text-base rounded-full shadow-rest hover:shadow-hover transition-all disabled:bg-surface-sunken disabled:text-muted-foreground disabled:shadow-none disabled:cursor-not-allowed flex justify-center items-center gap-3 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card ${extraClass}`}
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
    <div className="relative min-h-screen px-5 pb-40 pt-28 lg:pb-20">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-hero-background bg-[repeating-linear-gradient(115deg,#80808014_0px,#80808014_1.5px,transparent_1.5px,transparent_40px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)]"
      />

      <div className="mx-auto w-full max-w-5xl">
        <div className="text-center mb-8">
          <p className="font-display text-3xl font-bold uppercase text-foreground">
            SMADARUN <span className="accent-mark">2027</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Portal pendaftaran resmi</p>
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

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          {/* KOLOM FORM */}
          <form
            id="formDaftar"
            onSubmit={handleSubmit}
            noValidate
            className="rounded-card border border-border bg-card p-6 shadow-rest md:p-9"
          >
            <fieldset disabled={isFormClosed} className="space-y-10">
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
                    onChange={(e) => setPemesanIkut(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-primary"
                  />
                  <label htmlFor="pemesanIkut" className="cursor-pointer text-xs font-medium leading-relaxed text-foreground-accent">
                    Saya (pemesan) juga ikut lari sebagai <span className="font-bold text-foreground">Peserta 1</span>.
                  </label>
                </div>
              </section>

              {/* LANGKAH 2 — PESERTA */}
              <section className="space-y-5">
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
                  const p = dataPesertaEfektif(raw, index);
                  const errs = pesertaErrors[raw.key] || {};
                  const identitasDariPemesan = index === 0 && pemesanIkut;

                  return (
                    <div key={raw.key} className="rounded-field border border-border bg-surface-sunken/60 p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="font-display text-base font-bold text-foreground">
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
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground-accent transition hover:border-danger hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor={`peserta-${index}-nik`} className={labelClass}>NIK (16 digit)</label>
                            <input
                              id={`peserta-${index}-nik`}
                              type="text"
                              inputMode="numeric"
                              maxLength={16}
                              autoComplete="off"
                              value={p.nik}
                              onChange={(e) => handlePesertaChange(raw.key, "nik", e.target.value)}
                              onBlur={(e) => handlePesertaBlur(raw.key, "nik", e.target.value)}
                              placeholder="16 digit angka"
                              aria-invalid={!!errs.nik}
                              aria-describedby={errs.nik ? `peserta-${index}-nik-error` : `peserta-${index}-nik-hint`}
                              className={fieldClass(!!errs.nik)}
                            />
                            {errs.nik ? (
                              <FieldError id={`peserta-${index}-nik-error`} message={errs.nik} />
                            ) : (
                              <p id={`peserta-${index}-nik-hint`} className="mt-1.5 text-xs text-muted-foreground">
                                Pelajar: pakai NIK di KTP/Kartu Keluarga.
                              </p>
                            )}
                          </div>
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
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor={`peserta-${index}-wilayah`} className={labelClass}>Kota Domisili</label>
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
                            <FieldError id={`peserta-${index}-wilayah-error`} message={errs.wilayah} />
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
                      className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-border-strong px-5 py-3 text-sm font-bold text-foreground transition hover:border-primary-accent hover:text-primary-accent disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
              <section className="space-y-5">
                <StepHeading step={3} title="Konfirmasi & Bayar" hint="Periksa rincian biaya sebelum melanjutkan ke pembayaran." />

                {KotakRingkasanError}

                {/* Rincian inline — di desktop informasi yang sama tampil di kartu sticky. */}
                {PENDAFTARAN_DIBUKA && (
                  <div className="rounded-field border border-border bg-surface-sunken p-5 lg:hidden">
                    <p className="mb-3 text-sm font-semibold text-foreground">Rincian biaya</p>
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
                    <FieldError id="privacy-error" message={consentErrors.privacy} />
                  </div>
                </div>
              </section>
            </fieldset>
          </form>

          {/* KOLOM RINGKASAN — sticky di desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-card border border-border bg-card p-6 shadow-rest">
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
                  <div className="mt-6">{submitButton()}</div>
                  <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                    Pembayaran diproses oleh <a href="https://kembar.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">PT KEMBAR INOVASI</a>. Anda akan diarahkan ke halaman pembayaran resmi.{" "}
                    <Link href="/daftar/status" className="font-semibold underline underline-offset-2 hover:text-foreground-accent">
                      Sudah bayar?
                    </Link>
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

      {/* Bar aksi sticky (mobile & tablet) */}
      {PENDAFTARAN_DIBUKA && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-4 px-5 py-3 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">
                Total · {pesertaList.length} tiket
              </div>
              <div className="font-display text-xl font-bold leading-none text-foreground tabular-nums">
                {rupiah(totalAmount)}
              </div>
              {ringkasanError && (
                <div className="mt-1 text-[11px] font-bold text-danger">
                  {ringkasanError.jumlah} isian belum benar
                </div>
              )}
            </div>
            <div className="ml-auto flex w-36 shrink-0 flex-col items-center gap-1.5 sm:w-44">
              <div className="w-full">{submitButton("Bayar", "py-3")}</div>
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
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl ${
                modal.success ? "bg-success-surface text-success" : "bg-danger-surface text-danger"
              }`}
              aria-hidden="true"
            >
              {modal.success ? "✓" : "✕"}
            </div>
            <DialogTitle className="mb-2 font-display text-xl font-bold text-foreground">{modal.title}</DialogTitle>
            <p className="mb-6 text-sm leading-relaxed text-foreground-accent">{modal.message}</p>
            <div className="flex flex-col gap-2">
              {modal.success && (
                <Link
                  href="/daftar/status"
                  className="w-full rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  Lihat langkah berikutnya
                </Link>
              )}
              <button
                onClick={() => setModal((prev) => ({ ...prev, show: false }))}
                className="w-full rounded-full bg-secondary px-6 py-2.5 text-sm font-bold text-on-secondary transition hover:bg-secondary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                Tutup
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
