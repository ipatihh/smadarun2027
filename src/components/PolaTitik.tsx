/**
 * Pola titik halftone berpilin, diambil dari motif jersey SMADARUN 2027.
 * Murni dekoratif (aria-hidden), statis, dan sangat ringan: satu <path> per lingkar,
 * titik digambar sebagai garis nol-panjang berujung bulat. Warna lewat token (`stroke-primary`),
 * jadi ikut mode gelap. Letakkan absolut di tepi seksi; jangan di belakang teks isi atau form.
 */
const CINCIN = 11;
const JARAK = 24;

function buatLintasan() {
  const hasil: { d: string; lebar: number }[] = [];
  for (let i = 2; i <= CINCIN + 1; i += 1) {
    const r = i * JARAK;
    const jumlah = Math.max(8, Math.round((2 * Math.PI * r) / JARAK));
    const puntir = i * 0.42;
    let d = "";
    for (let k = 0; k < jumlah; k += 1) {
      const a = (k / jumlah) * Math.PI * 2 + puntir;
      // Lingkar dipepatkan menjadi elips supaya mirip pusaran pada kaus.
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r * 0.78;
      d += `M${x.toFixed(1)} ${y.toFixed(1)}h0`;
    }
    hasil.push({ d, lebar: 2 + i * 0.55 });
  }
  return hasil;
}

const LINTASAN = buatLintasan();
const SISI = (CINCIN + 2) * JARAK * 2;

export default function PolaTitik({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none select-none ${className}`}
      viewBox={`${-SISI / 2} ${-SISI / 2} ${SISI} ${SISI}`}
      fill="none"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      {LINTASAN.map((p, i) => (
        <path key={i} d={p.d} strokeWidth={p.lebar} className="stroke-primary/70" />
      ))}
    </svg>
  );
}
