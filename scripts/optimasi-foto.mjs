// Mengecilkan foto di public/images supaya ringan (sumber untuk next/image DAN lightbox galeri,
// yang memuat berkas mentah apa adanya). Jalankan:  node scripts/optimasi-foto.mjs <folder-berkas-asli>
//
// Skrip membaca ASLI dari <folder-berkas-asli> (salinan di luar public/, mis. dari panitia atau
// riwayat git) dan menulis hasilnya ke public/images. Aman dijalankan ulang: selalu dari asli.
// Mencetak dimensi hasil — salin ke src/data/gallery.ts (width/height harus sama dengan berkas).
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";

const asal = process.argv[2];
if (!asal) {
  console.error("Pemakaian: node scripts/optimasi-foto.mjs <folder-berkas-asli>");
  process.exit(1);
}
const dirKeluar = "public/images";

const jpg = { quality: 80, mozjpeg: true };
const tugas = [
  // Hero: dipotong ke area yang memang tampil (x 23–77%, y 25–78%). Foto asli bertuliskan "SMADA RUN 2026"
  // (tengah-atas, y 10–23%) dan "18 JANUARI 2026" (tengah-bawah, y 79–87%); potongan ini membuang
  // keduanya, jadi Hero.tsx tidak perlu zoom CSS (zoom meregangkan foto dan memaksa berkas besar).
  // `keluar` = nama berkas baru (nama baru = cache optimizer Next/Vercel otomatis tidak basi).
  { berkas: "hero1.JPG", keluar: "hero-start.jpg", crop: { l: 0.23, t: 0.25, w: 0.54, h: 0.53 }, lebar: 2880, opsi: jpg },
  // Galeri: tampil paling lebar ±1280px (2x retina = 2560); lightbox memuat berkas ini langsung.
  ...[
    ["hero4.JPG", "galeri-podium.jpg"],
    ["hero5.JPG", "galeri-finis.jpg"],
    ["hero3.JPG", "galeri-juara.jpg"],
    ["hero7.JPG", "galeri-peserta.jpg"],
    ["hero6.JPG", "galeri-start.jpg"],
  ].map(([berkas, keluar]) => ({ berkas, keluar, lebar: 2400, opsi: jpg })),
  // Gambar panduan ukuran jersey (modal): cukup 1600px sisi panjang.
  { berkas: "pocari-1.jpg", sisiPanjang: 1600, opsi: jpg },
  // Avatar testimoni tampil ±44px.
  { berkas: "ivatih-1.jpg", lebar: 256, opsi: jpg },
];

const kb = (n) => `${Math.round(n / 1024)} KB`;

for (const t of tugas) {
  const sumber = path.join(asal, t.berkas);
  let img = sharp(sumber).rotate();
  const meta = await img.metadata();
  if (t.crop) {
    img = img.extract({
      left: Math.round(meta.width * t.crop.l),
      top: Math.round(meta.height * t.crop.t),
      width: Math.round(meta.width * t.crop.w),
      height: Math.round(meta.height * t.crop.h),
    });
  }
  if (t.lebar) img = img.resize({ width: t.lebar, withoutEnlargement: true });
  if (t.sisiPanjang) img = img.resize({ width: t.sisiPanjang, height: t.sisiPanjang, fit: "inside", withoutEnlargement: true });
  const tujuan = path.join(dirKeluar, t.keluar ?? t.berkas);
  const info = await img.jpeg(t.opsi).toFile(tujuan + ".tmp");
  fs.renameSync(tujuan + ".tmp", tujuan);
  console.log(`${(t.keluar ?? t.berkas).padEnd(20)} ${meta.width}x${meta.height} ${kb(fs.statSync(sumber).size)}  ->  ${info.width}x${info.height} ${kb(info.size)}`);
}

// Logo sponsor: tampil di kotak 240x96 — 960px lebar sudah 4x.
const dirSponsor = path.join(asal, "sponsors");
if (fs.existsSync(dirSponsor)) {
  for (const berkas of fs.readdirSync(dirSponsor).filter((f) => f.endsWith(".png"))) {
    const sumber = path.join(dirSponsor, berkas);
    const tujuan = path.join(dirKeluar, "sponsors", berkas);
    const info = await sharp(sumber).resize({ width: 960, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(tujuan + ".tmp");
    fs.renameSync(tujuan + ".tmp", tujuan);
    console.log(`sponsors/${berkas.padEnd(22)} ${kb(fs.statSync(sumber).size)}  ->  ${info.width}x${info.height} ${kb(info.size)}`);
  }
}
