import type { Metadata } from "next";
import Link from "next/link";
import { FiMail, FiClock, FiHelpCircle, FiCreditCard } from "react-icons/fi";
import { footerDetails } from "@/data/footer";

export const metadata: Metadata = {
  title: "Status Pendaftaran — SMADARUN 2027",
  description: "Panduan setelah menyelesaikan pembayaran pendaftaran SMADARUN 2027.",
  robots: { index: false, follow: false },
};

/**
 * Tujuan balik setelah pembayaran. Sebelumnya peserta yang menutup halaman pembayaran
 * tidak punya tempat kembali sama sekali di situs ini.
 *
 * Halaman ini sengaja INFORMASIONAL, bukan pengecek status: kembarin-v2 belum
 * menyediakan endpoint publik untuk melihat status pesanan, dan mengarang tampilan
 * "berhasil/gagal" tanpa data asli justru menyesatkan orang yang baru membayar.
 * Karena itu SEMUA teks di sini bersyarat ("bila pembayaran sudah selesai…") — dulu judul
 * "pendaftaran Anda sedang diproses" + ikon centang + "pembayaran Anda tetap tercatat"
 * terbaca sebagai konfirmasi sukses, padahal halaman ini juga dibuka orang yang belum
 * atau gagal membayar. Kalau core nanti membuka endpoint status (dengan token akses
 * pesanan), halaman inilah tempat memasangnya.
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
          <p className="font-display text-3xl font-bold uppercase text-foreground">
            SMADARUN <span className="accent-mark">2027</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Status pendaftaran</p>
        </div>

        <div className="mt-8 rounded-card border border-border bg-card p-6 shadow-rest md:p-9">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Setelah halaman pembayaran
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground-accent">
            Halaman ini belum terhubung ke catatan pesanan, jadi tidak dapat memastikan apakah
            pembayaran Anda berhasil. Status resmi selalu mengikuti email konfirmasi dan catatan
            sistem pembayaran.
          </p>

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
              className="w-full rounded-full bg-primary px-6 py-3.5 text-center text-sm font-bold text-on-primary shadow-rest transition-all hover:bg-primary-accent hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-card"
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
