// Membuat favicon (icon.png, apple-icon.png, favicon.ico-pengganti) dan OG image bertema
// "Jersey Violet" (gradien ungu→indigo + titik halftone berpilin), tanpa logo.
// Jalankan:  node scripts/buat-aset-jersey.mjs
// Ganti ikon/OG ini dengan logo resmi bila sudah ada (lihat docs/PANDUAN_ASET.md).
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const FROM = "#8A1BE0";
const VIA = "#5A12D8";
const TO = "#2A10C8";
const DOT = "#C61FB5";

/** Titik halftone berpilin; sama dengan src/components/PolaTitik.tsx. */
function swirl(cx, cy, skala, opacity) {
  let out = "";
  for (let i = 2; i <= 12; i += 1) {
    const r = i * 24;
    const n = Math.max(8, Math.round((2 * Math.PI * r) / 24));
    const puntir = i * 0.42;
    const rad = (2 + i * 0.55) / 2;
    for (let k = 0; k < n; k += 1) {
      const a = (k / n) * Math.PI * 2 + puntir;
      const x = cx + Math.cos(a) * r * skala;
      const y = cy + Math.sin(a) * r * 0.78 * skala;
      out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rad * skala).toFixed(2)}"/>`;
    }
  }
  return `<g fill="${DOT}" opacity="${opacity}">${out}</g>`;
}

const gradien = (id) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${FROM}"/><stop offset="0.55" stop-color="${VIA}"/><stop offset="1" stop-color="${TO}"/></linearGradient>`;

// Favicon: garis burung hantu dari lambang medali (scripts/aset/burung-hantu-garis.jpg, gambar mentah
// dari panitia), dipotong tanpa tulisan & lingkaran, ditebalkan supaya terbaca di 32 px, lalu
// diwarnai putih di atas gradien jersey.
const SUMBER = "scripts/aset/burung-hantu-garis.jpg";
const meta = await sharp(SUMBER).metadata();
const sk = meta.width / 1600; // koordinat di bawah ditulis untuk lebar 1600 px
// Hanya wajah (telinga sampai cakar), supaya fiturnya besar dan jelas di ukuran tab.
const area = { left: Math.round(450 * sk), top: Math.round(440 * sk), width: Math.round(640 * sk), height: Math.round(640 * sk) };
const TEBAL = 10; // sigma blur; makin besar garis makin tebal
// Blur dan linear harus dua langkah terpisah: sharp menjalankan linear SEBELUM blur dalam satu rantai.
const kabur = await sharp(SUMBER).extract(area).greyscale().negate().blur(TEBAL * sk).toBuffer();
const tinta = await sharp(kabur)
  .linear(6, -50)
  .resize(400)
  .toColourspace("b-w")
  .raw()
  .toBuffer({ resolveWithObject: true });
// Buang cincin lingkaran luar (di luar radius 505 dari pusat lambang) dan lunakkan tepi bawah.
{
  const { width: w, height: h } = tinta.info;
  const k = w / area.width;
  const cx = (770 * sk - area.left) * k, cy = (760 * sk - area.top) * k, rad = 300 * sk * k;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const jarak = Math.hypot(x - cx, y - cy);
      const lingkar = Math.min(1, Math.max(0, (rad - jarak) / 6));
      const bawah = Math.min(1, Math.max(0, (h - y) / 1));
      tinta.data[y * w + x] = Math.round(tinta.data[y * w + x] * lingkar * bawah);
    }
  }
}
const putih = Buffer.alloc(tinta.info.width * tinta.info.height * 3, 255);
const burung = await sharp(putih, { raw: { width: tinta.info.width, height: tinta.info.height, channels: 3 } })
  .joinChannel(tinta.data, { raw: { width: tinta.info.width, height: tinta.info.height, channels: 1 } })
  .png()
  .toBuffer();
const tBurung = tinta.info.height;
const latar = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<defs>${gradien("g")}<clipPath id="c"><rect width="512" height="512" rx="112"/></clipPath></defs>
<g clip-path="url(#c)"><rect width="512" height="512" fill="url(#g)"/>${swirl(470, 470, 0.7, 0.4)}</g></svg>`;
const ikonPng = await sharp(Buffer.from(latar))
  .composite([{ input: burung, left: 56, top: Math.round(256 - tBurung / 2) }])
  .png()
  .toBuffer();

await sharp(ikonPng).png().toFile("src/app/icon.png");
await sharp(ikonPng).resize(180, 180).png().toFile("src/app/apple-icon.png");
const ico = await sharp(ikonPng).resize(32, 32).png().toBuffer();
// favicon.ico berisi PNG 32x32 (didukung semua browser modern).
const head = Buffer.alloc(22);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
head[6] = 32; head[7] = 32; head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12);
head.writeUInt32LE(ico.length, 14); head.writeUInt32LE(22, 18);
writeFileSync("src/app/favicon.ico", Buffer.concat([head, ico]));

// OG image 1200x630: foto hero di kanan, ditutup gradien jersey, judul di kiri.
const foto = await sharp("public/images/hero-start.jpg").resize(1200, 630, { fit: "cover" }).toBuffer();
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>${gradien("g")}<linearGradient id="m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2A10C8" stop-opacity="0.97"/><stop offset="0.5" stop-color="#5A12D8" stop-opacity="0.9"/><stop offset="1" stop-color="#8A1BE0" stop-opacity="0.55"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#m)"/>
${swirl(1010, 150, 1.2, 0.5)}
<text x="80" y="170" font-family="Helvetica Neue, Arial, sans-serif" font-weight="600" font-size="26" letter-spacing="5" fill="#D6C8FA">SMA NEGERI 2 NGANJUK</text>
<text x="74" y="330" font-family="Helvetica Neue, Arial, sans-serif" font-weight="700" font-size="150" letter-spacing="-5" fill="#fff">SMADARUN</text>
<text x="80" y="420" font-family="Helvetica Neue, Arial, sans-serif" font-weight="500" font-size="64" fill="#D6C8FA">2027</text>
<rect x="80" y="470" width="260" height="64" rx="32" fill="${DOT}"/>
<text x="210" y="512" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-weight="700" font-size="28" fill="#fff">Lomba Lari</text>
</svg>`;
const og = await sharp(foto).composite([{ input: Buffer.from(ogSvg) }]).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
writeFileSync("src/app/opengraph-image.jpg", og);
writeFileSync("src/app/twitter-image.jpg", og);
console.log("OG", og.length, "bytes");

// Burung hantu putih transparan untuk hero (public/images/logo/).
//  - burung-hantu.png      : wajah + cakar, garis tipis; cakar mencengkeram tepi atas panel foto.
//  - burung-hantu-ikon.png : versi tebal & bulat untuk ikon kecil di baris kicker.
async function putihTransparan(area, sigma, gain, bias, lebar, file, potongBulat) {
  const kab = await sharp(SUMBER).extract(area).greyscale().negate().blur(sigma).toBuffer();
  const t = await sharp(kab).linear(gain, bias).resize(lebar).toColourspace("b-w").raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = t.info;
  if (potongBulat) {
    const k = w / area.width;
    const cx = (770 * sk - area.left) * k, cy = (760 * sk - area.top) * k, rad = (potongBulat === "wajah" ? 318 : 300) * sk * k;
    for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
      let m = Math.min(1, Math.max(0, (rad - Math.hypot(x - cx, y - cy)) / 4));
      // Mode wajah: bagian cakar (di bawah y=880 pada koordinat 1600 px) dipertahankan utuh.
      if (potongBulat === "wajah") {
        const yAsli = (y / k + area.top) / sk;
        m = Math.max(m, Math.min(1, Math.max(0, (yAsli - 875) / 10)));
      }
      t.data[y * w + x] = Math.round(t.data[y * w + x] * m);
    }
  }
  await sharp(Buffer.alloc(w * h * 3, 255), { raw: { width: w, height: h, channels: 3 } })
    .joinChannel(t.data, { raw: { width: w, height: h, channels: 1 } })
    .png()
    .toFile(file);
  console.log(file, w, h);
}
await putihTransparan(
  { left: Math.round(420 * sk), top: Math.round(500 * sk), width: Math.round(710 * sk), height: Math.round(485 * sk) },
  1.2 * sk, 2.2, -20, 640, "public/images/logo/burung-hantu.png", "wajah",
);
await putihTransparan(
  { left: Math.round(450 * sk), top: Math.round(440 * sk), width: Math.round(640 * sk), height: Math.round(640 * sk) },
  TEBAL * sk, 6, -50, 96, "public/images/logo/burung-hantu-ikon.png", true,
);
