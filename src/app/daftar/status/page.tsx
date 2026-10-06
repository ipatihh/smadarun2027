import type { Metadata } from "next";
import Link from "next/link";
import { FiMail, FiClock, FiHelpCircle, FiCreditCard } from "react-icons/fi";
import { footerDetails } from "@/data/footer";
import PemeriksaStatus from "./PemeriksaStatus";

export const metadata: Metadata = {
  title: "Status Pendaftaran — SMADARUN 2027",
  description: "Panduan setelah menyelesaikan pembayaran pendaftaran SMADARUN 2027.",
  robots: { index: false, follow: false },
};

/**
 * Tujuan balik setelah pembayaran. Sebelumnya peserta yang menutup halaman pembayaran
 * tidak punya tempat kembali sama sekali di situs ini.
 *
 * Status SUNGGUHAN hanya ditampilkan oleh <PemeriksaStatus>, untuk pesanan terakhir yang
 * dibuat dari tab ini (kode + token status di sessionStorage, diperiksa ke core lewat
 * api/status-pesanan). Teks statis di bawahnya tetap BERSYARAT ("bila pembayaran sudah
 * selesai…"): halaman ini juga dibuka orang yang belum atau gagal membayar, dan dulu
 * judul "pendaftaran Anda sedang diproses" + ikon centang terbaca sebagai konfirmasi sukses.
 */
const langkah = [
  {
    icon: FiCreditCard,
    judul: "Bila pembayaran sudah selesai",
    isi: (
      <>
        <a href="https://kembar.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">PT KEMBAR INOVASI</a> mengonfirmasi transaksi ke sistem pendaftaran secara otomatis.
      </>
    ),
  },
  {
    icon: FiMail,
    judul: "Periksa email pemesan",
    isi: "Bukti pendaftaran dikirim ke email pemesan setelah pembayaran terkonfirmasi. Periksa juga folder Spam atau Promosi.",
  },
  {
    icon: FiClock,
    judul: "Konfirmasi bisa butuh beberapa menit",
    isi: "Umumnya masuk dalam beberapa menit; pada jam sibuk bisa lebih lama.",
  },
];

export default function StatusPendaftaranPage() {
  return (
    <div className="relative min-h-screen px-5 pb-20 pt-28">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-hero-background bg-[repeating-linear-gradient(115deg,#80808014_0px,#80808014_1.5px,transparent_1.5px,transparent_40px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)]"
      />

      <div className="mx-auto w-full max-w-2xl">
        <div className="text-center">
          <p className="font-display text-3xl font-semibold uppercase tracking-[0.02em] text-foreground">
            SMADARUN <span className="accent-mark">2027</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Status pendaftaran</p>
        </div>

        <div className="mt-8 rounded-card border border-border bg-card p-6  md:p-9">
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">
            Status pendaftaran
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground-accent">
            Pesanan yang dibuat dari tab peramban ini diperiksa langsung ke sistem pendaftaran dan
            tampil di bawah. Untuk pesanan lain, ikuti panduan berikut; status resmi selalu
            mengikuti email konfirmasi dan catatan sistem pembayaran.
          </p>

          <PemeriksaStatus />

          <ol className="mt-8 space-y-6">
            {langkah.map((item, index) => (
              <li key={item.judul} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {index + 1}. {item.judul}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground-accent">{item.isi}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 rounded-field border border-border bg-surface-sunken p-5">
            <div className="flex items-start gap-3">
              <FiHelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-foreground-accent" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-foreground">Belum menerima email, atau halaman pembayaran tertutup?</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground-accent">
                  Hubungi panitia dan sebutkan nama pemesan, email yang dipakai mendaftar, serta kode
                  pesanan bila ada. Jangan mengulang pendaftaran sebelum dicek — pesanan dan
                  pembayaran bisa terhitung dua kali.
                </p>
                <a
                  href={`mailto:${footerDetails.email}?subject=Konfirmasi%20Pendaftaran%20SMADARUN%202027`}
                  className="mt-2 inline-block text-sm font-semibold text-foreground underline underline-offset-4 hover:text-foreground-accent"
                >
                  {footerDetails.email}
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="w-full rounded-full bg-primary px-6 py-3.5 text-center text-sm font-bold text-on-primary transition-all hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              Kembali ke beranda
            </Link>
            <Link
              href="/daftar"
              className="w-full rounded-full border border-border-strong px-6 py-3.5 text-center text-sm font-bold text-foreground transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              Daftarkan peserta lain
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
