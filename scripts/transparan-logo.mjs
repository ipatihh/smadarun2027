// Mengubah logo berlatar HITAM (mis. stiker dengan outline putih) menjadi PNG berlatar TRANSPARAN,
// dipangkas rapat, lalu menyimpannya ke public/images/sponsors/. Jalankan:
//   node scripts/transparan-logo.mjs <berkas-asli> <nama-keluaran.png>
// Contoh: node scripts/transparan-logo.mjs ~/Downloads/logo.png sate-sor-nongko.png
//
// Cara kerja: latar gelap yang tersambung ke TEPI gambar dibuang (flood fill), tepinya dihaluskan
// lewat alpha. Outline putih stiker SENGAJA dipertahankan — dialah yang membuat teks gelap tetap
// terbaca di atas latar terang maupun mode gelap. Hanya cocok untuk logo yang punya outline/isi
// terang yang menutup teks gelapnya; untuk logo lain, minta panitia mengirim PNG transparan asli.
// Setelah dijalankan, lihat hasilnya di atas latar lavender DAN gelap sebelum dipasang.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const [asal, nama] = process.argv.slice(2);
if (!asal || !nama) {
  console.error("Pemakaian: node scripts/transparan-logo.mjs <berkas-asli> <nama-keluaran.png>");
  process.exit(1);
}

if (!fs.existsSync(asal)) {
  console.error(`Berkas asli tidak ditemukan: ${asal}\nIsi dengan path logo yang sebenarnya (contoh di komentar kepala hanyalah contoh).`);
  process.exit(1);
}

const AMBANG = 235; // kecerahan di bawah ini = dianggap latar (outline putih ±255 menahan isian)
const PAD = 4;

const { data, info } = await sharp(asal).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const lum = (i) => (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;

const latar = new Uint8Array(W * H);
const tumpukan = [];
for (let x = 0; x < W; x++) tumpukan.push(x, 0, x, H - 1);
for (let y = 0; y < H; y++) tumpukan.push(0, y, W - 1, y);
while (tumpukan.length) {
  const y = tumpukan.pop();
  const x = tumpukan.pop();
  if (x < 0 || y < 0 || x >= W || y >= H) continue;
  const p = y * W + x;
  if (latar[p] || lum(p * 3) >= AMBANG) continue;
  latar[p] = 1;
  tumpukan.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
}

const out = Buffer.alloc(W * H * 4);
let x0 = W, y0 = H, x1 = -1, y1 = -1;
for (let p = 0; p < W * H; p++) {
  if (latar[p]) {
    const a = Math.min(255, Math.round((lum(p * 3) / AMBANG) * 255));
    out[p * 4] = out[p * 4 + 1] = out[p * 4 + 2] = 255;
    out[p * 4 + 3] = a < 12 ? 0 : a;
  } else {
    out[p * 4] = data[p * 3];
    out[p * 4 + 1] = data[p * 3 + 1];
    out[p * 4 + 2] = data[p * 3 + 2];
    out[p * 4 + 3] = 255;
  }
  if (out[p * 4 + 3] > 20) {
    const x = p % W, y = (p / W) | 0;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
}

const tujuan = path.join("public/images/sponsors", nama);
await sharp(out, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left: Math.max(0, x0 - PAD), top: Math.max(0, y0 - PAD), width: x1 - x0 + 1 + 2 * PAD, height: y1 - y0 + 1 + 2 * PAD })
  .png({ compressionLevel: 9 })
  .toFile(tujuan);
const m = await sharp(tujuan).metadata();
console.log(`${tujuan}: ${m.width}×${m.height} (rasio ${(m.width / m.height).toFixed(1)}:1)`);
console.log(m.width / m.height > 4 ? "Rasio > 4:1 → pasang dengan `wide: true`." : "Rasio biasa → `wide` tidak perlu.");
