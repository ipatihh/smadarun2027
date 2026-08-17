"use client";

import React, { useMemo, useState, ChangeEvent, FocusEvent, FormEvent } from "react";
import Image from "next/image";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { tiketMarketing } from "@/data/tiket";
import { LiveTicketType } from "@/lib/kembarinEvents";

interface FormDataState {
  nama: string;
  email: string;
  nik: string;
  whatsapp: string;
  gender: string;
  kota: string;
  kategori: string;
  size: string;
}

type FieldName = keyof FormDataState;
type SubmitData = FormDataState & Record<string, unknown>;

// Hanya domain resmi gateway DOKU yang boleh dituju saat redirect otomatis ke halaman pembayaran.
// Mencegah open-redirect/phishing seandainya respons backend core suatu saat tidak sesuai ekspektasi.
const ALLOWED_PAYMENT_HOSTS = [
  "doku.com",
  "sandbox.doku.com",
  "checkout.doku.com",
];

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
const VALIDATORS: Record<FieldName, (value: string) => string | null> = {
  nama: (v) => {
    const t = v.trim();
    if (!t) return "Nama lengkap wajib diisi.";
    if (t.length < 3) return "Nama minimal 3 karakter.";
    if (t.length > 100) return "Nama maksimal 100 karakter.";
    if (!/^[a-zA-Z\s.']+$/.test(t)) return "Hanya huruf, spasi, titik, dan tanda kutip yang diperbolehkan.";
    return null;
  },
  email: (v) => {
    const t = v.trim();
    if (!t) return "Email wajib diisi.";
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(t)) return "Format email belum benar, contoh: nama@email.com";
    return null;
  },
  nik: (v) => {
    const t = v.trim();
    if (!t) return "NIK wajib diisi.";
    if (!/^\d{16}$/.test(t)) return `NIK harus 16 digit angka (sekarang ${t.length} karakter).`;
    return null;
  },
  whatsapp: (v) => {
    const t = v.trim();
    if (!t) return "Nomor WhatsApp wajib diisi.";
    if (!/^\+?\d{8,15}$/.test(t)) return "Isi 8–15 digit angka tanpa spasi/strip, contoh: 081234567890";
    return null;
  },
  gender: (v) => (v ? null : "Pilih jenis kelamin."),
  kota: (v) => {
    const t = v.trim();
    if (!t) return "Kota domisili wajib diisi.";
    if (t.length < 2) return "Nama kota minimal 2 karakter.";
    if (t.length > 100) return "Nama kota maksimal 100 karakter.";
    if (!/^[a-zA-Z\s.'-]+$/.test(t)) return "Hanya huruf, spasi, titik, strip, dan tanda kutip yang diperbolehkan.";
    return null;
  },
  kategori: (v) => (v ? null : "Pilih kategori lomba."),
  size: (v) => (v ? null : "Pilih ukuran jersey."),
};

const FIELD_ORDER: FieldName[] = ["nama", "email", "nik", "whatsapp", "gender", "kota", "kategori", "size"];

interface DaftarFormProps {
  ticketTypes: LiveTicketType[];
  isOpen: boolean;
  // Biaya layanan/admin per transaksi, live dari event_config.admin_fee_amount kembarin-v2
  // (lihat src/lib/kembarinEvents.ts) — bukan hardcode di sisi ini.
  adminFee: number;
  /** Jadwal pembukaan pendaftaran yang sudah diformat WIB, kalau panitia mengisinya. */
  opensAtLabel: string | null;
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const fieldClass = (hasError: boolean) =>
  `w-full p-3.5 bg-surface-sunken border rounded-field text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-4 ${
    hasError
      ? "border-danger focus:border-danger focus:ring-danger/20"
      : "border-border focus:border-primary-accent focus:ring-primary/25"
  }`;

const labelClass = "block text-xs font-bold uppercase tracking-wider text-foreground-accent mb-2";

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
      <h3 className="font-display text-lg font-bold uppercase tracking-wide text-foreground leading-none">{title}</h3>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  </div>
);

export default function DaftarForm({ ticketTypes, isOpen, adminFee, opensAtLabel }: DaftarFormProps) {
  const WEBHOOK_URL = "/api/daftar";
  const imageSrc = "/images/ivan-1.jpg";

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

  const [formData, setFormData] = useState<FormDataState>({
    nama: "",
    email: "",
    nik: "",
    whatsapp: "",
    gender: "",
    kota: "",
    kategori: KATEGORI_KEYS[0] || "",
    size: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [isHealthyChecked, setIsHealthyChecked] = useState(false);
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [consentErrors, setConsentErrors] = useState<{ health?: string; privacy?: string }>({});

  const [loading, setLoading] = useState(false);
  const [isImgOpen, setIsImgOpen] = useState(false);
  const [modal, setModal] = useState<{ show: boolean; success: boolean; title: string; message: string }>({
    show: false,
    success: false,
    title: "",
    message: "",
  });

  const selectedCategory = KATEGORI_TIKET[formData.kategori] || KATEGORI_TIKET[KATEGORI_KEYS[0]] || { label: "-", price: 0 };
  const subtotal = selectedCategory.price;
  const totalAmount = subtotal + adminFee;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Error dibersihkan begitu pengguna mulai memperbaiki — jangan menyalahkan sambil mengetik.
    if (errors[name as FieldName]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const name = e.target.name as FieldName;
    const validator = VALIDATORS[name];
    if (!validator) return;
    const message = validator(e.target.value);
    setErrors((prev) => ({ ...prev, [name]: message ?? undefined }));
  };

  const validateAll = () => {
    const nextErrors: Partial<Record<FieldName, string>> = {};
    for (const field of FIELD_ORDER) {
      const message = VALIDATORS[field](formData[field]);
      if (message) nextErrors[field] = message;
    }
    return nextErrors;
  };

  const focusField = (name: string) => {
    const el = document.getElementById(name);
    if (el) {
      el.focus();
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || isFormClosed) return;

    // 1) Validasi field
    const nextErrors = validateAll();
    setErrors(nextErrors);

    // 2) Validasi persetujuan — tombol sengaja TIDAK di-disable supaya alasannya bisa dijelaskan.
    const nextConsentErrors = {
      health: isHealthyChecked ? undefined : "Pernyataan kondisi sehat wajib dicentang.",
      privacy: isConsentChecked ? undefined : "Persetujuan kebijakan privasi wajib dicentang.",
    };
    setConsentErrors(nextConsentErrors);

    const firstInvalidField = FIELD_ORDER.find((f) => nextErrors[f]);
    if (firstInvalidField) {
      focusField(firstInvalidField);
      return;
    }
    if (nextConsentErrors.health) return focusField("healthDeclaration");
    if (nextConsentErrors.privacy) return focusField("privacyConsent");

    setLoading(true);

    const payload: SubmitData = {
      eventCode: "smadarun",
      nama: formData.nama.trim(),
      email: formData.email.trim(),
      nik: formData.nik.trim(),
      whatsapp: formData.whatsapp.trim(),
      gender: formData.gender,
      kota: formData.kota.trim(),
      kategori: formData.kategori,

      // Tiket / Subtotal Murni
      subtotal: subtotal,
      ticket_price: subtotal,
      price: subtotal,

      // Biaya Layanan Platform (Semua Alias, nilai live dari kembarin-v2)
      admin_fee: adminFee,
      platform_fee: adminFee,
      service_fee: adminFee,
      fee: adminFee,
      biaya_admin: adminFee,
      biaya_layanan: adminFee,

      // Total Pembayaran (Subtotal + Biaya Layanan) (Semua Alias)
      total_amount: totalAmount,
      totalAmount: totalAmount,
      nominal: totalAmount,
      amount: totalAmount,
      total: totalAmount,
      total_price: totalAmount,

      paymentGateway: "doku",
      payment_gateway: "doku",
      size: formData.size,
      custom_fields: {},

      // Persetujuan peserta — ikut dikirim dan divalidasi ulang di server
      // (api/daftar/route.ts), bukan cuma mengunci tombol di browser.
      health_declaration: true,
      privacy_consent: true,
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
        const paymentUrl = result.paymentUrl || result.payment_url || result.data?.paymentUrl || result.data?.payment_url;

        if (paymentUrl) {
          // Redirect hanya diizinkan ke domain resmi DOKU untuk mencegah open-redirect/phishing.
          if (!isTrustedPaymentUrl(paymentUrl)) {
            throw new Error(
              "Tautan pembayaran yang diterima tidak berasal dari domain resmi DOKU. Pendaftaran dibatalkan demi keamanan Anda."
            );
          }
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

        setFormData({
          nama: "",
          email: "",
          nik: "",
          whatsapp: "",
          gender: "",
          kota: "",
          kategori: KATEGORI_KEYS[0] || "",
          size: "",
        });
        setIsHealthyChecked(false);
        setIsConsentChecked(false);
        setErrors({});
        setConsentErrors({});
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
      setLoading(false);
    }
  };

  // Rincian biaya — dipakai dua kali: inline (mobile) & di kartu ringkasan sticky (desktop).
  const RincianBiaya = (
    <dl className="space-y-2.5 text-sm">
      <div className="flex justify-between gap-4 text-foreground-accent font-medium">
        <dt>Tiket {selectedCategory.label}</dt>
        <dd className="tabular-nums">{rupiah(subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4 text-foreground-accent font-medium">
        <dt>Biaya layanan platform</dt>
        <dd className="tabular-nums">{rupiah(adminFee)}</dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-border pt-2.5 font-black text-base text-foreground">
        <dt>Total pembayaran</dt>
        <dd className="tabular-nums">{rupiah(totalAmount)}</dd>
      </div>
    </dl>
  );

  const submitButton = (label = "Konfirmasi & Bayar", extraClass = "py-4") => (
    <button
      type="submit"
      form="formDaftar"
      disabled={loading || isFormClosed}
      className={`w-full bg-primary hover:bg-primary-accent text-on-primary font-extrabold text-sm uppercase tracking-wider rounded-full shadow-rest hover:shadow-hover transition-all disabled:bg-surface-sunken disabled:text-muted-foreground disabled:shadow-none disabled:cursor-not-allowed flex justify-center items-center gap-3 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card ${extraClass}`}
    >
      <span>{loading ? "Memproses…" : label}</span>
      {loading && (
        <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" aria-hidden="true" />
      )}
    </button>
  );

  return (
    <div className="relative min-h-screen overflow-hidden px-5 pb-40 pt-28 lg:pb-20">
      {/* Motif speed-lines yang sama dengan hero — sebelumnya halaman ini memakai
          dot-grid generik sehingga terasa seperti situs yang berbeda. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-hero-background bg-[repeating-linear-gradient(115deg,#80808014_0px,#80808014_1.5px,transparent_1.5px,transparent_40px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)]"
      />

      <div className="mx-auto w-full max-w-5xl">
        <div className="text-center mb-8">
          <p className="font-display text-3xl font-bold uppercase text-foreground">
            SMADARUN <span className="text-primary-accent">2027</span>
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Portal Pendaftaran Resmi
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

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          {/* KOLOM FORM */}
          <form
            id="formDaftar"
            onSubmit={handleSubmit}
            noValidate
            className="rounded-card border border-border bg-card p-6 shadow-rest md:p-9"
          >
            <fieldset disabled={isFormClosed} className="space-y-10">
              {/* LANGKAH 1 */}
              <section className="space-y-5">
                <StepHeading step={1} title="Data Diri" hint="Isi sesuai identitas resmi — dipakai untuk verifikasi race pack." />
                <div>
                  <label htmlFor="nama" className={labelClass}>Nama lengkap</label>
                  <input
                    id="nama"
                    name="nama"
                    type="text"
                    autoComplete="name"
                    value={formData.nama}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Sesuai KTP / Kartu Pelajar"
                    aria-invalid={!!errors.nama}
                    aria-describedby={errors.nama ? "nama-error" : undefined}
                    className={fieldClass(!!errors.nama)}
                  />
                  <FieldError id="nama-error" message={errors.nama} />
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>Alamat email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="contoh@email.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : "email-hint"}
                    className={fieldClass(!!errors.email)}
                  />
                  {errors.email ? (
                    <FieldError id="email-error" message={errors.email} />
                  ) : (
                    <p id="email-hint" className="mt-1.5 text-xs text-muted-foreground">
                      Bukti pendaftaran & tautan pembayaran dikirim ke email ini.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="nik" className={labelClass}>NIK (16 digit)</label>
                    <input
                      id="nik"
                      name="nik"
                      type="text"
                      inputMode="numeric"
                      maxLength={16}
                      autoComplete="off"
                      value={formData.nik}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="16 digit angka"
                      aria-invalid={!!errors.nik}
                      aria-describedby={errors.nik ? "nik-error" : "nik-hint"}
                      className={fieldClass(!!errors.nik)}
                    />
                    {errors.nik ? (
                      <FieldError id="nik-error" message={errors.nik} />
                    ) : (
                      <p id="nik-hint" className="mt-1.5 text-xs text-muted-foreground">
                        Pelajar: pakai NIK di KTP/Kartu Keluarga.
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="whatsapp" className={labelClass}>Nomor WhatsApp</label>
                    <input
                      id="whatsapp"
                      name="whatsapp"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="081234567890"
                      aria-invalid={!!errors.whatsapp}
                      aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined}
                      className={fieldClass(!!errors.whatsapp)}
                    />
                    <FieldError id="whatsapp-error" message={errors.whatsapp} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="gender" className={labelClass}>Jenis kelamin</label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      aria-invalid={!!errors.gender}
                      aria-describedby={errors.gender ? "gender-error" : undefined}
                      className={fieldClass(!!errors.gender)}
                    >
                      <option value="" disabled>Pilih jenis kelamin</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                    <FieldError id="gender-error" message={errors.gender} />
                  </div>
                  <div>
                    <label htmlFor="kota" className={labelClass}>Kota domisili</label>
                    <input
                      id="kota"
                      name="kota"
                      type="text"
                      autoComplete="address-level2"
                      value={formData.kota}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Contoh: Nganjuk"
                      aria-invalid={!!errors.kota}
                      aria-describedby={errors.kota ? "kota-error" : undefined}
                      className={fieldClass(!!errors.kota)}
                    />
                    <FieldError id="kota-error" message={errors.kota} />
                  </div>
                </div>
              </section>

              {/* LANGKAH 2 */}
              <section className="space-y-5">
                <StepHeading step={2} title="Lomba & Jersey" hint="Ukuran jersey tidak bisa diubah setelah pembayaran." />
                {PENDAFTARAN_DIBUKA && (
                  <div>
                    <label htmlFor="kategori" className={labelClass}>Kategori lomba</label>
                    <select
                      id="kategori"
                      name="kategori"
                      value={formData.kategori}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      aria-invalid={!!errors.kategori}
                      aria-describedby={errors.kategori ? "kategori-error" : undefined}
                      className={fieldClass(!!errors.kategori)}
                    >
                      {Object.entries(KATEGORI_TIKET).map(([key, cat]) => (
                        <option key={key} value={key}>
                          {cat.label} — {rupiah(cat.price)}
                        </option>
                      ))}
                    </select>
                    <FieldError id="kategori-error" message={errors.kategori} />
                  </div>
                )}
                <div>
                  <label htmlFor="size" className={labelClass}>Ukuran jersey (unisex)</label>
                  <select
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    aria-invalid={!!errors.size}
                    aria-describedby={errors.size ? "size-error" : undefined}
                    className={fieldClass(!!errors.size)}
                  >
                    <option value="" disabled>Pilih ukuran</option>
                    {["XS", "S", "M", "L", "XL", "XXL", "XXXL"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <FieldError id="size-error" message={errors.size} />
                </div>
                <div>
                  <span className={labelClass}>Panduan ukuran</span>
                  <button
                    type="button"
                    onClick={() => setIsImgOpen(true)}
                    className="block w-full overflow-hidden rounded-field border border-border bg-surface-sunken p-2 transition hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  >
                    <Image
                      src={imageSrc}
                      alt="Tabel panduan ukuran jersey"
                      width={1994}
                      height={1387}
                      sizes="(max-width: 1024px) 100vw, 560px"
                      className="h-auto w-full rounded-lg"
                    />
                    <span className="mt-2 block text-xs font-semibold text-muted-foreground">
                      Ketuk untuk memperbesar
                    </span>
                  </button>
                </div>
              </section>

              {/* LANGKAH 3 */}
              <section className="space-y-5">
                <StepHeading step={3} title="Konfirmasi & Bayar" hint="Periksa rincian biaya sebelum melanjutkan ke pembayaran." />

                {/* Rincian inline — di desktop informasi yang sama tampil di kartu sticky. */}
                {PENDAFTARAN_DIBUKA && (
                  <div className="rounded-field border border-border bg-surface-sunken p-5 lg:hidden">
                    <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
                      Rincian biaya
                    </p>
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
                      Saya menyatakan dengan sadar bahwa saya dalam kondisi{" "}
                      <span className="font-bold text-foreground">sehat walafiat</span>, memiliki fisik yang prima, dan{" "}
                      <span className="font-bold text-foreground">bertanggung jawab penuh</span> atas keselamatan diri saya sendiri
                      selama mengikuti seluruh rangkaian kegiatan SMADARUN 2027.
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
                      Saya telah membaca dan menyetujui{" "}
                      <span className="font-bold text-foreground">Kebijakan Privasi</span>, serta memberikan persetujuan atas
                      pengumpulan dan pemrosesan data pribadi saya (termasuk NIK, email, dan nomor WhatsApp) untuk keperluan
                      pendaftaran dan verifikasi kepesertaan SMADARUN 2027.
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
              <p className="mb-4 text-xs font-black uppercase tracking-widest text-muted-foreground">
                Ringkasan pesanan
              </p>
              {PENDAFTARAN_DIBUKA ? (
                <>
                  {RincianBiaya}
                  <div className="mt-6">{submitButton()}</div>
                  <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                    Pembayaran diproses oleh DOKU. Anda akan diarahkan ke halaman pembayaran resmi.
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
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Total</div>
              <div className="font-display text-xl font-bold leading-none text-foreground tabular-nums">
                {rupiah(totalAmount)}
              </div>
            </div>
            <div className="ml-auto w-36 shrink-0 sm:w-44">{submitButton("Bayar", "py-3.5")}</div>
          </div>
        </div>
      )}

      {/* Lightbox panduan ukuran */}
      <Dialog open={isImgOpen} onClose={() => setIsImgOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-overlay backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="relative w-full max-w-2xl">
            <DialogTitle className="sr-only">Panduan ukuran jersey</DialogTitle>
            <button
              onClick={() => setIsImgOpen(false)}
              className="absolute -top-11 right-0 rounded-full px-3 text-3xl font-bold text-on-secondary/80 transition hover:text-on-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span aria-hidden="true">&times;</span>
              <span className="sr-only">Tutup</span>
            </button>
            <Image
              src={imageSrc}
              alt="Tabel panduan ukuran jersey diperbesar"
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
            <DialogTitle className="mb-2 font-display text-xl font-black text-foreground">{modal.title}</DialogTitle>
            <p className="mb-6 text-sm leading-relaxed text-foreground-accent">{modal.message}</p>
            <button
              onClick={() => setModal((prev) => ({ ...prev, show: false }))}
              className="w-full rounded-full bg-secondary px-6 py-2.5 text-sm font-bold text-on-secondary transition hover:bg-secondary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              Tutup
            </button>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
