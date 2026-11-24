// Mengubah logo berlatar PUTIH (teks/gambar gelap) menjadi PNG berlatar TRANSPARAN dengan outline putih
// tipis di sekeliling tinta, dipangkas rapat, lalu disimpan ke public/images/sponsors/. Jalankan:
//   node scripts/transparan-logo-putih.mjs <berkas-asli> <nama-keluaran.png> [lebar-maks=1000]
//
// Pasangan skrip `transparan-logo.mjs` (yang itu untuk latar HITAM). Outline putih (ala stiker) membuat
// logo bertinta gelap tetap terbaca di mode gelap, dan menyatu di latar terang. Isi logo TIDAK diubah:
// hanya latar yang dibuang. Lihat hasilnya di atas latar lavender DAN gelap sebelum dipasang.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const [asal, nama, lebarArg] = process.argv.slice(2);
if (!asal || !nama) {
  console.error("Pemakaian: node scripts/transparan-logo-putih.mjs <berkas-asli> <nama-keluaran.png> [lebar-maks]");
  process.exit(1);
}
if (!fs.existsSync(asal)) {
  console.error(`Berkas asli tidak ditemukan: ${asal}`);
  process.exit(1);
}

const LEBAR_MAKS = Number(lebarArg) || 1000;
const R = 5; // tebal outline (px, pada ukuran keluaran)

const meta = await sharp(asal).metadata();
const lebar = Math.min(LEBAR_MAKS, meta.width);
const { data, info } = await sharp(asal)
  .resize({ width: lebar })
  .flatten({ background: "#ffffff" })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;

// Tinta: alpha dari kegelapan (putih = 0), warna dipulihkan dari campuran dengan putih.
const ink = new Uint8Array(W * H);
const rgba = Buffer.alloc(W * H * 4);
for (let p = 0; p < W * H; p++) {
  const r = data[p * 3], g = data[p * 3 + 1], b = data[p * 3 + 2];
  const a = Math.max(0, Math.min(1, (255 - Math.min(r, g, b)) / 255));
  const aa = a < 0.04 ? 0 : a;
  ink[p] = Math.round(aa * 255);
  if (aa > 0) {
    rgba[p * 4] = Math.max(0, Math.round(255 - (255 - r) / aa));
    rgba[p * 4 + 1] = Math.max(0, Math.round(255 - (255 - g) / aa));
    rgba[p * 4 + 2] = Math.max(0, Math.round(255 - (255 - b) / aa));
  }
  rgba[p * 4 + 3] = ink[p];
}

// Outline: dilatasi (maks. dalam lingkaran radius R) lalu sedikit dihaluskan.
const tmp = new Uint8Array(W * H), dil = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  let m = 0;
  for (let k = -R; k <= R; k++) { const xx = x + k; if (xx >= 0 && xx < W) m = Math.max(m, ink[y * W + xx]); }
  tmp[y * W + x] = m;
}
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  let m = 0;
  for (let k = -R; k <= R; k++) { const yy = y + k; if (yy >= 0 && yy < H) m = Math.max(m, tmp[yy * W + x]); }
  dil[y * W + x] = m;
}
const { data: halus, info: infoH } = await sharp(Buffer.from(dil), { raw: { width: W, height: H, channels: 1 } })
  .blur(1.2)
  .raw()
  .toBuffer({ resolveWithObject: true });
const outline = Buffer.alloc(W * H * 4);
for (let p = 0; p < W * H; p++) {
  outline[p * 4] = outline[p * 4 + 1] = outline[p * 4 + 2] = 255;
  outline[p * 4 + 3] = Math.min(255, halus[p * infoH.channels] * 2);
}

// Pangkas rapat ke area outline.
let x0 = W, y0 = H, x1 = -1, y1 = -1;
for (let p = 0; p < W * H; p++) if (outline[p * 4 + 3] > 20) {
  const x = p % W, y = (p / W) | 0;
  x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
}
const kotak = { left: Math.max(0, x0 - 1), top: Math.max(0, y0 - 1), width: Math.min(W, x1 + 2) - Math.max(0, x0 - 1), height: Math.min(H, y1 + 2) - Math.max(0, y0 - 1) };

const lapOutline = await sharp(outline, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
const lapTinta = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
const tujuan = path.join("public/images/sponsors", nama);
const gabung = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: lapOutline }, { input: lapTinta }])
  .png()
  .toBuffer();
await sharp(gabung).extract(kotak).png({ compressionLevel: 9 }).toFile(tujuan);
const m = await sharp(tujuan).metadata();
console.log(`${tujuan}: ${m.width}×${m.height} (rasio ${(m.width / m.height).toFixed(1)}:1)`);
console.log(m.width / m.height > 4 ? "Rasio > 4:1 → pasang dengan `wide: true`." : "Rasio biasa → `wide` tidak perlu.");
