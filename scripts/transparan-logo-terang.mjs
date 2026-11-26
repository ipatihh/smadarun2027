// Mengubah logo TERANG (perak/putih) berlatar HITAM menjadi PNG berlatar TRANSPARAN dengan outline
// gelap di sekelilingnya, dipangkas rapat, lalu disimpan ke public/images/sponsors/. Jalankan:
//   node scripts/transparan-logo-terang.mjs <berkas-asli> <nama-keluaran.png> [lebar-maks=600]
//
// Kebalikan `transparan-logo.mjs` (yang itu untuk logo berteks GELAP beroutline putih di latar hitam).
// Tanpa outline gelap, logo perak nyaris hilang di latar lavender. Isi logo TIDAK diubah.
// Lihat hasilnya di atas latar lavender DAN gelap sebelum dipasang.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const [asal, nama, lebarArg] = process.argv.slice(2);
if (!asal || !nama) {
  console.error("Pemakaian: node scripts/transparan-logo-terang.mjs <berkas-asli> <nama-keluaran.png> [lebar-maks]");
  process.exit(1);
}
if (!fs.existsSync(asal)) {
  console.error(`Berkas asli tidak ditemukan: ${asal}`);
  process.exit(1);
}

const LEBAR_MAKS = Number(lebarArg) || 600;
const HITAM = 10; // kecerahan latar
const PENUH = 60; // mulai kecerahan ini piksel dianggap tinta penuh
const GELAP = [14, 9, 30]; // warna outline

// 1) Pangkas latar hitam, lalu kecilkan, lalu beri ruang untuk outline.
const rapat = await sharp(asal).removeAlpha().trim({ background: "#000000", threshold: 30 }).toBuffer();
const R = Math.max(3, Math.round(LEBAR_MAKS / 75)); // tebal outline
const kecil = await sharp(rapat).resize({ width: LEBAR_MAKS - 2 * (R + 2), withoutEnlargement: true }).toBuffer();
const { data, info } = await sharp(kecil)
  .extend({ top: R + 2, bottom: R + 2, left: R + 2, right: R + 2, background: "#000000" })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;

// 2) Alpha dari kecerahan; warna dipulihkan dari campuran dengan hitam.
const alpha = new Uint8Array(W * H);
const tinta = Buffer.alloc(W * H * 4);
for (let p = 0; p < W * H; p++) {
  const r = data[p * 3], g = data[p * 3 + 1], b = data[p * 3 + 2];
  const a = Math.max(0, Math.min(1, (Math.max(r, g, b) - HITAM) / (PENUH - HITAM)));
  alpha[p] = Math.round(a * 255);
  if (a > 0) {
    tinta[p * 4] = r;
    tinta[p * 4 + 1] = g;
    tinta[p * 4 + 2] = b;
  }
  tinta[p * 4 + 3] = alpha[p];
}

// 3) Outline gelap: dilatasi melingkar radius R.
const lingkar = [];
for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) if (x * x + y * y <= R * R) lingkar.push([x, y]);
const outline = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  let m = 0;
  for (const [dx, dy] of lingkar) {
    const xx = x + dx, yy = y + dy;
    if (xx >= 0 && yy >= 0 && xx < W && yy < H && alpha[yy * W + xx] > m) m = alpha[yy * W + xx];
  }
  const i = (y * W + x) * 4;
  [outline[i], outline[i + 1], outline[i + 2]] = GELAP;
  outline[i + 3] = m;
}

const raw = { raw: { width: W, height: H, channels: 4 } };
const tujuan = path.join("public/images/sponsors", nama);
await sharp(await sharp(outline, raw).png().toBuffer())
  .composite([{ input: await sharp(tinta, raw).png().toBuffer() }])
  .png({ compressionLevel: 9 })
  .toFile(tujuan);
const m = await sharp(tujuan).metadata();
console.log(`${tujuan}: ${m.width}×${m.height} (rasio ${(m.width / m.height).toFixed(1)}:1)`);
