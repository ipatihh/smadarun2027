import { Suspense } from "react";
import Footer from "./Footer";
import { getLiveEventData } from "@/lib/kembarinEvents";

/**
 * Pembungkus footer yang menunggu data live SENDIRIAN.
 *
 * Sebelumnya root layout yang `async` menunggu getLiveEventData(), sehingga SELURUH
 * halaman — header, konten, semuanya — tertahan di satu Suspense boundary tingkat root
 * hanya demi satu angka biaya layanan di teks Syarat & Ketentuan. Akibatnya setiap
 * kunjungan menampilkan kerangka satu halaman penuh dan kecepatan halaman jadi
 * bergantung pada kecepatan kembar.in.
 *
 * Sekarang penantian itu dikurung di footer saja: header dan isi halaman tampil
 * seketika, footer menyusul.
 */
async function FooterDenganBiaya() {
  const live = await getLiveEventData();
  return <Footer adminFee={live.adminFee} />;
}

export default function FooterLive() {
  return (
    <Suspense fallback={<Footer adminFee={0} />}>
      <FooterDenganBiaya />
    </Suspense>
  );
}
