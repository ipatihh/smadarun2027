"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { tiketMarketing } from "@/data/tiket";
import { LiveTicketType } from "@/lib/kembarinEvents";
import { revealContainer, revealChild } from "@/lib/motion";

// Biaya Layanan Platform Rp 5.000 per transaksi (spesifik ke platform smadarun2027 ini,
// bukan bagian dari harga tiket yang diatur kembarin-v2).
const PLATFORM_ADMIN_FEE = 5000;

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

interface DaftarFormProps {
  ticketTypes: LiveTicketType[];
  isOpen: boolean;
}

export default function DaftarForm({ ticketTypes, isOpen }: DaftarFormProps) {
  // ALUR TERPUSAT: Mengarah langsung ke API Route internal Next.js (Secure API Proxy)
  const WEBHOOK_URL = "/api/daftar";
  const imageSrc = "/images/ivan-1.jpg";

  // Kategori & harga diambil live dari kembarin-v2 (props dari Server Component page.tsx),
  // bukan hardcode di sini. Nama tampilan diselaraskan dengan tiketMarketing kalau ada.
  const KATEGORI_TIKET: Record<string, { label: string; price: number }> = Object.fromEntries(
    ticketTypes.map((t) => {
      const marketing = tiketMarketing.find(
        (m) => m.categoryKey.toLowerCase() === t.categoryKey.toLowerCase()
      );
      const displayName = marketing?.name ?? t.categoryKey;
      return [t.categoryKey, { label: `${displayName} - Rp ${t.price.toLocaleString("id-ID")}`, price: t.price }];
    })
  );
  const KATEGORI_KEYS = Object.keys(KATEGORI_TIKET);
  const PENDAFTARAN_DIBUKA = isOpen && KATEGORI_KEYS.length > 0;

  const [isHealthyChecked, setIsHealthyChecked] = useState<boolean>(false);
  const [isConsentChecked, setIsConsentChecked] = useState<boolean>(false);
  // Form otomatis tertutup kalau event belum aktif atau tidak ada kategori tersedia
  // di kembarin-v2 — dikontrol penuh dari dasbor Super Admin kembarin-v2, tidak
  // perlu diubah manual di sini.
  const isFormClosed = !PENDAFTARAN_DIBUKA;
  const [formData, setFormData] = useState<FormDataState>({
    nama: "",
    email: "",
    nik: "",
    whatsapp: "",
    gender: "", // Awalnya kosong wajib dipilih
    kota: "",
    kategori: KATEGORI_KEYS[0] || "",
    size: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [isImgOpen, setIsImgOpen] = useState<boolean>(false);

  const [modal, setModal] = useState<{ show: boolean; success: boolean; title: string; message: string }>({
    show: false,
    success: false,
    title: "",
    message: "",
  });

  // Hitung otomatis subtotal & total amount berdasarkan pilihan kategori
  const selectedCategory = KATEGORI_TIKET[formData.kategori] || KATEGORI_TIKET[KATEGORI_KEYS[0]] || { price: 0 };
  const subtotal = selectedCategory.price;
  const totalAmount = subtotal + PLATFORM_ADMIN_FEE;

  const handleKategoriChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, kategori: e.target.value }));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return; // Proteksi instan double submit dari klik brutal di frontend

    setLoading(true);

    // Pemetaan data yang diselaraskan secara presisi dengan skema backend Kembarin (kembarin-v2) & DOKU Gateway
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

      // Biaya Layanan Platform Rp 5.000 (Semua Alias)
      admin_fee: PLATFORM_ADMIN_FEE,
      adminFee: PLATFORM_ADMIN_FEE,
      platform_fee: PLATFORM_ADMIN_FEE,
      service_fee: PLATFORM_ADMIN_FEE,
      fee: PLATFORM_ADMIN_FEE,
      biaya_admin: PLATFORM_ADMIN_FEE,
      biaya_layanan: PLATFORM_ADMIN_FEE,

      // Total Pembayaran (Subtotal + Rp 5.000) (Semua Alias)
      total_amount: totalAmount,
      totalAmount: totalAmount,
      nominal: totalAmount,
      amount: totalAmount,
      total: totalAmount,
      total_price: totalAmount,

      paymentGateway: "doku",
      payment_gateway: "doku",
      size: formData.size,
      custom_fields: {}
    };

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          `Server mengembalikan respons tidak valid (HTTP ${response.status}). Silakan coba beberapa saat lagi.`
        );
      }

      const result = await response.json();

      if (response.ok && result.success !== false) {
        // Cek URL pembayaran otomatis DOKU Gateway dari Backend Kembarin
        const paymentUrl = result.paymentUrl || result.payment_url || result.data?.paymentUrl || result.data?.payment_url;

        if (paymentUrl) {
          // Redirect hanya diizinkan ke domain resmi DOKU untuk mencegah open-redirect/phishing
          // jika suatu saat respons dari core system tidak sesuai ekspektasi.
          if (!isTrustedPaymentUrl(paymentUrl)) {
            throw new Error(
              "Tautan pembayaran yang diterima tidak berasal dari domain resmi DOKU. Pendaftaran dibatalkan demi keamanan Anda."
            );
          }
          // Redirect peserta secara otomatis ke halaman pembayaran DOKU Gateway
          window.location.href = paymentUrl;
          return;
        }

        // Fallback jika tidak ada paymentUrl
        setModal({
          show: true,
          success: true,
          title: "Pendaftaran Berhasil!",
          message: result.message || "Data pendaftaran Anda telah aman tersimpan. Silakan periksa email Anda untuk rincian pembayaran.",
        });

        // Reset form secara reaktif
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
      } else {
        throw new Error(result.message || result.error || "Gagal memproses pendaftaran");
      }
    } catch (err: unknown) {
      setModal({
        show: true,
        success: false,
        title: "Pendaftaran Gagal",
        message: err instanceof Error ? err.message : "Gagal mengirim data pendaftaran. Silakan periksa koneksi Anda dan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center items-center pb-12 pt-28 px-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      <motion.div
        className="w-full max-w-xl z-10"
        variants={revealContainer}
        initial="offscreen"
        animate="onscreen"
      >
        <motion.div variants={revealChild} className="text-center mb-8">
          <div className="font-display font-bold text-3xl uppercase text-foreground">SMADARUN <span className="text-primary-accent">2027</span></div>
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Official Registration Portal</div>
        </motion.div>
        <motion.div variants={revealChild} className="bg-card rounded-2xl border border-border p-6 md:p-10 shadow-xl text-foreground">
          <h3 className="text-center font-bold text-2xl text-foreground mb-8">FORMULIR PENDAFTARAN</h3>

          {isFormClosed && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-sm font-bold text-amber-800">Pendaftaran Belum Dibuka</p>
              <p className="text-xs text-amber-700 mt-1">Semua kategori tiket sedang tidak tersedia saat ini. Silakan cek kembali nanti atau pantau info resmi panitia.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset disabled={isFormClosed} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-accent mb-2">Nama Lengkap</label>
              <input type="text" name="nama" value={formData.nama} onChange={handleInputChange} placeholder="Sesuai KTP / Kartu Pelajar" className="w-full p-3.5 bg-gray-50 border border-border rounded-xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition" required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-accent mb-2">Alamat Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="contoh@email.com" className="w-full p-3.5 bg-gray-50 border border-border rounded-xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground-accent mb-2">NIK KTP / Kartu Pelajar</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={16}
                  autoComplete="off"
                  name="nik"
                  value={formData.nik}
                  onChange={handleInputChange}
                  placeholder="16 digit angka"
                  className="w-full p-3.5 bg-gray-50 border border-border rounded-xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground-accent mb-2">Nomor WhatsApp</label>
                <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} placeholder="08xxxxx" className="w-full p-3.5 bg-gray-50 border border-border rounded-xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition" required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground-accent mb-2">Jenis Kelamin</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-3.5 bg-gray-50 border border-border rounded-xl text-sm focus:border-primary outline-none transition" required>
                  <option value="" disabled>Pilih Jenis Kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground-accent mb-2">Kota Domisili</label>
                <input type="text" name="kota" value={formData.kota} onChange={handleInputChange} placeholder="Contoh: Nganjuk" className="w-full p-3.5 bg-gray-50 border border-border rounded-xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition" required />
              </div>
            </div>
            {PENDAFTARAN_DIBUKA && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground-accent mb-2">Kategori Lomba</label>
                <select name="kategori" value={formData.kategori} onChange={handleKategoriChange} className="w-full p-3.5 bg-gray-50 border border-border rounded-xl text-sm focus:border-primary outline-none transition" required>
                  {Object.entries(KATEGORI_TIKET).map(([key, cat]) => (
                    <option key={key} value={key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-accent mb-2">Ukuran Jersey (Unisex)</label>
              <select name="size" value={formData.size} onChange={handleInputChange} className="w-full p-3.5 bg-gray-50 border border-border rounded-xl text-sm focus:border-primary outline-none transition" required>
                <option value="" disabled>Pilih Ukuran</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
                <option value="XXXL">XXXL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-accent mb-2">Panduan Ukuran</label>
              <div className="p-2 bg-gray-100 border border-border rounded-xl overflow-hidden">
                <Image
                  src={imageSrc}
                  alt="Size Chart"
                  width={1994}
                  height={1387}
                  className="w-full h-auto rounded-lg cursor-zoom-in opacity-90 hover:opacity-100 transition duration-300"
                  onClick={() => setIsImgOpen(true)}
                />
              </div>
            </div>

            {/* Rincian Biaya Pendaftaran */}
            {PENDAFTARAN_DIBUKA && (
              <div className="bg-gray-50 border border-border p-5 rounded-xl space-y-2.5 text-sm">
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Rincian Biaya Pendaftaran</div>
                <div className="flex justify-between text-foreground-accent font-medium">
                  <span>Biaya Tiket Kategori ({formData.kategori})</span>
                  <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-foreground-accent font-medium">
                  <span>Biaya Layanan Platform</span>
                  <span>Rp {PLATFORM_ADMIN_FEE.toLocaleString("id-ID")}</span>
                </div>
                <div className="border-t border-border pt-2.5 flex justify-between font-black text-foreground text-base">
                  <span>Total Pembayaran</span>
                  <span className="text-secondary">Rp {totalAmount.toLocaleString("id-ID")}</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 bg-zinc-50 border border-border rounded-xl select-none">
              <input type="checkbox" id="healthDeclaration" checked={isHealthyChecked} onChange={(e) => setIsHealthyChecked(e.target.checked)} className="mt-0.5 w-4 h-4 text-primary-accent border-border rounded focus:ring-primary accent-primary cursor-pointer" />
              <label htmlFor="healthDeclaration" className="text-xs text-foreground-accent leading-relaxed cursor-pointer font-medium">
                Saya menyatakan dengan sadar bahwa saya dalam kondisi <span className="font-bold text-foreground">sehat walafiat</span>, memiliki fisik yang prima, dan <span className="font-bold text-foreground">bertanggung jawab penuh</span> atas keselamatan diri saya sendiri selama mengikuti seluruh rangkaian kegiatan SMADARUN 2027.
              </label>
            </div>
            <div className="flex items-start gap-3 p-4 bg-zinc-50 border border-border rounded-xl select-none">
              <input type="checkbox" id="privacyConsent" checked={isConsentChecked} onChange={(e) => setIsConsentChecked(e.target.checked)} className="mt-0.5 w-4 h-4 text-primary-accent border-border rounded focus:ring-primary accent-primary cursor-pointer" />
              <label htmlFor="privacyConsent" className="text-xs text-foreground-accent leading-relaxed cursor-pointer font-medium">
                Saya telah membaca dan menyetujui <span className="font-bold text-foreground">Kebijakan Privasi</span>, serta memberikan persetujuan atas pengumpulan dan pemrosesan data pribadi saya (termasuk NIK, email, dan nomor WhatsApp) untuk keperluan pendaftaran dan verifikasi kepesertaan SMADARUN 2027.
              </label>
            </div>
            <button type="submit" disabled={loading || isFormClosed || !isHealthyChecked || !isConsentChecked} className="w-full py-4 bg-primary hover:bg-primary-accent text-black font-extrabold text-sm uppercase tracking-wider rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:bg-gray-200 disabled:text-gray-400 disabled:transform-none disabled:cursor-not-allowed flex justify-center items-center gap-3">
              <span>{loading ? "MEMPROSES PENDAFTARAN..." : "KONFIRMASI & BAYAR SEKARANG"}</span>
              {loading && <div className="w-5 h-5 border-3 border-black/20 border-t-black rounded-full animate-spin"></div>}
            </button>
            </fieldset>
          </form>
        </motion.div>
      </motion.div>

      {isImgOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300" onClick={() => setIsImgOpen(false)}>
          <div className="relative max-w-2xl w-full flex flex-col items-center">
            <button onClick={() => setIsImgOpen(false)} className="absolute -top-12 right-2 text-white/80 hover:text-white text-3xl font-bold transition focus:outline-none">&times;</button>
            <Image
              src={imageSrc}
              alt="Size Chart Expanded"
              width={1994}
              height={1387}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {modal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-card p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl border border-border">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl ${modal.success ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>{modal.success ? "✓" : "✕"}</div>
            <h4 className="text-xl font-black text-foreground mb-2">{modal.title}</h4>
            <p className="text-sm text-foreground-accent mb-6 leading-relaxed">{modal.message}</p>

            <button onClick={() => setModal((prev) => ({ ...prev, show: false }))} className="px-6 py-2.5 bg-secondary hover:bg-secondary-accent text-white font-bold text-sm rounded-full w-full transition">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
