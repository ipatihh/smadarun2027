// Membuang latar "KOTAK-KOTAK PALSU" (pola papan catur abu/putih yang ikut tersimpan di JPG hasil unduhan,
// seolah transparan) atau latar putih polos, menjadi PNG berlatar TRANSPARAN yang dipangkas rapat di
// public/images/sponsors/. Jalankan:
//   node scripts/transparan-logo-kotak.mjs <berkas-asli> <nama-keluaran.png>
//
// Hanya cocok bila tepi luar logo BERWARNA/gelap (mis. lambang berbingkai hijau) — latar dibuang dengan
// flood fill dari tepi gambar atas piksel terang tak berwarna. Isi logo TIDAK diubah.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const [asal, nama] = process.argv.slice(2);
if (!asal || !nama) {
  console.error("Pemakaian: node scripts/transparan-logo-kotak.mjs <berkas-asli> <nama-keluaran.png>");
  process.exit(1);
}
if (!fs.existsSync(asal)) {
  console.error(`Berkas asli tidak ditemukan: ${asal}`);
  process.exit(1);
}

const { data, info } = await sharp(asal).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const latarkah = (p) => {
  const r = data[p * 3], g = data[p * 3 + 1], b = data[p * 3 + 2];
  const min = Math.min(r, g, b);
  return min > 175 && Math.max(r, g, b) - min < 40;
};

const latar = new Uint8Array(W * H);
const tumpukan = [];
for (let x = 0; x < W; x++) tumpukan.push(x, 0, x, H - 1);
for (let y = 0; y < H; y++) tumpukan.push(0, y, W - 1, y);
while (tumpukan.length) {
  const y = tumpukan.pop();
  const x = tumpukan.pop();
  if (x < 0 || y < 0 || x >= W || y >= H) continue;
  const p = y * W + x;
  if (latar[p] || !latarkah(p)) continue;
  latar[p] = 1;
  tumpukan.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
}

// Kikis 2 px (buang sisa campuran warna latar di tepi), lalu haluskan.
let topeng = Uint8Array.from(latar, (v) => (v ? 0 : 255));
for (let n = 0; n < 2; n++) {
  const baru = Uint8Array.from(topeng);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const p = y * W + x;
    if (topeng[p] && (!topeng[p - 1] || !topeng[p + 1] || !topeng[p - W] || !topeng[p + W])) baru[p] = 0;
  }
  topeng = baru;
}
const { data: halus, info: infoH } = await sharp(Buffer.from(topeng), { raw: { width: W, height: H, channels: 1 } })
  .blur(0.7)
  .raw()
  .toBuffer({ resolveWithObject: true });

const out = Buffer.alloc(W * H * 4);
let x0 = W, y0 = H, x1 = -1, y1 = -1;
for (let p = 0; p < W * H; p++) {
  const a = halus[p * infoH.channels];
  out[p * 4] = data[p * 3];
  out[p * 4 + 1] = data[p * 3 + 1];
  out[p * 4 + 2] = data[p * 3 + 2];
  out[p * 4 + 3] = a;
  if (a > 20) {
    const x = p % W, y = (p / W) | 0;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
}

const tujuan = path.join("public/images/sponsors", nama);
await sharp(out, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
  .png({ compressionLevel: 9 })
  .toFile(tujuan);
const m = await sharp(tujuan).metadata();
console.log(`${tujuan}: ${m.width}×${m.height} (rasio ${(m.width / m.height).toFixed(1)}:1)`);
