import { footerDetails } from "@/data/footer";

/**
 * Isi Kebijakan Privasi — SATU sumber teks untuk dialog di footer dan dialog yang dibuka
 * langsung dari kotak persetujuan di /daftar (supaya pendaftar bisa membacanya tanpa
 * meninggalkan formulir dan kehilangan isian).
 */
export default function IsiKebijakanPrivasi() {
  return (
    <div className="text-sm text-foreground-accent space-y-3 max-h-[60vh] overflow-y-auto pr-2 leading-relaxed">
      <p>Panitia <strong>SMADARUN 2027</strong> berkomitmen menjaga keamanan dan kerahasiaan data pribadi Anda, sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.</p>
      <p><strong>1. Data yang dikumpulkan:</strong> Nama lengkap, alamat email, NIK atau nomor kartu pelajar, nomor WhatsApp, jenis kelamin, kota domisili, dan ukuran jersey. Data ini dipakai untuk validasi kepesertaan, pendataan asuransi/keselamatan, dan distribusi Race Pack.</p>
      <p><strong>2. Dasar pemrosesan:</strong> Persetujuan Anda, yang diberikan lewat kotak centang di formulir pendaftaran. Anda boleh menolak, dengan konsekuensi pendaftaran tidak dapat diproses.</p>
      <p><strong>3. Pihak yang ikut memproses:</strong> Data pendaftaran dan transaksi diproses secara terintegrasi oleh <strong><a href="https://kembar.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">PT KEMBAR INOVASI</a></strong> selaku <i>ticketing partner</i> resmi event ini. Panitia tidak pernah menerima atau menyimpan data kartu/rekening Anda.</p>
      <p><strong>4. Penyebarluasan:</strong> Data peserta tidak diperjualbelikan dan tidak dibagikan ke pihak lain di luar keperluan operasional resmi event dan kewajiban hukum yang berlaku.</p>
      <p><strong>5. Penyimpanan & hak Anda:</strong> Data disimpan selama penyelenggaraan event dan keperluan administrasi setelahnya. Anda berhak meminta akses, koreksi, atau penghapusan data dengan menghubungi <a className="font-semibold underline underline-offset-2" href={`mailto:${footerDetails.email}`}>{footerDetails.email}</a>.</p>
    </div>
  );
}
