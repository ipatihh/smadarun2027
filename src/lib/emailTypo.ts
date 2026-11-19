// CERMIN dari kembarin-v2 `domains/shared/emailTypo.ts` — salin apa adanya bila core
// mengubahnya. Core tetap menolak domain salah ketik dengan REGISTRATION_VALIDATION_FAILED;
// salinan ini hanya agar pendaftar melihat sarannya sebelum menekan Bayar.

/**
 * ============================================================================
 * DETEKSI SALAH KETIK DOMAIN EMAIL
 * ============================================================================
 * Peserta sering salah mengetik domain penyedia email besar: `gemail.com`,
 * `gmial.com`, `gmail.co`, `hayoo.com`. Pola regex lolos, tetapi email tiket
 * memantul (bounce). Pada 19 November 2026 rasio pantulan seperti ini ikut
 * membuat Hostinger menangguhkan pengiriman dari info@kembar.in, sehingga
 * seluruh email transaksional berhenti di tengah penjualan.
 *
 * Aturannya sengaja sempit agar tidak pernah menolak alamat yang sah:
 *   1. Domain penyedia yang sah (`VALID_DOMAINS`) tidak pernah ditandai,
 *      termasuk yang mirip satu sama lain (email.com, mail.com, ymail.com).
 *   2. Label penyedia benar tetapi akhiran salah (`gmail.co`, `yahoo.con`,
 *      `gmail.co.id`) → disarankan domain sah penyedia itu. Gmail dan iCloud
 *      hanya punya satu domain; penyedia berdomain negara (yahoo.com.sg,
 *      hotmail.co.uk) hanya ditandai bila akhirannya salah ketik dari `com`
 *      atau `co.id`, supaya alamat luar negeri tidak ikut tertolak.
 *   3. Label salah ketik dari penyedia (`gmial`, `yaho`, `hotmial`) dengan
 *      akhiran `com`/`co.id` (atau salah ketiknya) → disarankan penyedianya.
 *      Jarak ketik dihitung Damerau (tukar dua huruf bersebelahan = 1).
 *   4. Daftar salah ketik yang pernah terjadi tetapi jaraknya lebih jauh
 *      (`hayoo.com`).
 *
 * Domain lain (kantor, kampus, `.go.id`) tidak pernah disentuh. Cek MX DNS
 * sengaja tidak dipakai: banyak domain salah ketik justru punya MX milik
 * pemburu domain (gmai.com, gamil.com), dan checkout tidak boleh bergantung
 * pada DNS.
 *
 * Satu sumber untuk checkout core (`RegistrationOrderService`), Pendaftaran
 * Kolektif, form publik kembar.in, dan situs partner (yang menyalin modul ini
 * apa adanya — lihat `docs/PARTNER_INTEGRATION.md` §4d). Isomorfik, tanpa
 * dependensi.
 * ============================================================================
 */

/** Domain penyedia yang sah. Tidak pernah ditandai walau mirip penyedia lain. */
const VALID_DOMAINS: ReadonlySet<string> = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.id",
  "ymail.com",
  "rocketmail.com",
  "hotmail.com",
  "outlook.com",
  "outlook.co.id",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "mail.com",
  "email.com",
  "gmx.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "yandex.com",
  // Domain perusahaan nyata yang berjarak satu ketik dari penyedia.
  "wahoo.com",
]);

/**
 * Penyedia yang diperiksa. `single` = penyedia hanya punya domain itu, jadi
 * akhiran apa pun selain miliknya pasti salah (gmail.co.id tidak ada).
 */
const PROVIDERS: ReadonlyArray<{ label: string; domains: readonly string[]; single: boolean }> = [
  { label: "gmail", domains: ["gmail.com"], single: true },
  { label: "googlemail", domains: ["googlemail.com"], single: true },
  { label: "icloud", domains: ["icloud.com"], single: true },
  { label: "ymail", domains: ["ymail.com"], single: true },
  { label: "yahoo", domains: ["yahoo.com", "yahoo.co.id"], single: false },
  { label: "hotmail", domains: ["hotmail.com"], single: false },
  { label: "outlook", domains: ["outlook.com", "outlook.co.id"], single: false },
];

/** Salah ketik nyata yang jaraknya lebih dari batas aturan 3. */
const KNOWN_TYPOS: Readonly<Record<string, string>> = {
  "hayoo.com": "yahoo.com",
  "yahho.com": "yahoo.com",
  "gmaail.com": "gmail.com",
  "gmail.co.com": "gmail.com",
  "gmail.com.com": "gmail.com",
  "gmail.com.id": "gmail.com",
};

/** Jarak Damerau (optimal string alignment): sisip, hapus, ganti, tukar bersebelahan. */
export function typoDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i++) d[i][0] = i;
  for (let j = 0; j < cols; j++) d[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** Akhiran yang sah atau salah ketik satu langkah dari `com` / `co.id`. */
function nearestSuffix(suffix: string): "com" | "co.id" | null {
  if (suffix === "com" || suffix === "co.id") return suffix;
  if (typoDistance(suffix, "com") <= 1) return "com";
  if (typoDistance(suffix, "co.id") <= 1) return "co.id";
  return null;
}

function pickDomain(domains: readonly string[], suffix: "com" | "co.id" | null): string {
  const label = domains[0].split(".")[0];
  if (suffix && domains.includes(`${label}.${suffix}`)) return `${label}.${suffix}`;
  return domains[0];
}

/** Domain sah yang dimaksud, atau `null` bila domain tidak tampak salah ketik. */
export function suggestEmailDomain(rawDomain: string): string | null {
  const domain = rawDomain.trim().toLowerCase();
  if (!domain || VALID_DOMAINS.has(domain)) return null;

  const known = KNOWN_TYPOS[domain];
  if (known) return known;

  const dot = domain.indexOf(".");
  if (dot === -1) {
    // Titik terlupa: "gmailcom", "yahoocoid".
    for (const provider of PROVIDERS) {
      if (!domain.startsWith(provider.label)) continue;
      const rest = domain.slice(provider.label.length);
      if (rest === "com") return provider.domains[0];
      if (rest === "coid") return pickDomain(provider.domains, "co.id");
    }
    return null;
  }
  const label = domain.slice(0, dot);
  const suffix = domain.slice(dot + 1);
  const nearSuffix = nearestSuffix(suffix);

  // Aturan 2: label penyedia benar, akhiran salah.
  const exact = PROVIDERS.find((provider) => provider.label === label);
  if (exact) {
    if (exact.single) return exact.domains[0];
    return nearSuffix ? pickDomain(exact.domains, nearSuffix) : null;
  }

  // Aturan 3: label salah ketik dari penyedia. Hanya untuk akhiran com/co.id
  // (atau salah ketiknya) agar domain berlabel mirip di negara lain lolos.
  if (!nearSuffix || label.length < 4) return null;
  let best: { domain: string; distance: number } | null = null;
  for (const provider of PROVIDERS) {
    const limit = provider.label.length >= 7 ? 2 : 1;
    const distance = typoDistance(label, provider.label);
    if (distance === 0 || distance > limit) continue;
    if (!best || distance < best.distance) {
      best = { domain: pickDomain(provider.domains, nearSuffix), distance };
    }
  }
  if (!best || VALID_DOMAINS.has(`${label}.${nearSuffix}`)) return null;
  return best.domain;
}

/** Alamat lengkap yang dimaksud, atau `null` bila tidak tampak salah ketik. */
export function suggestEmailCorrection(email: string): string | null {
  const value = String(email ?? "").trim().toLowerCase();
  const at = value.lastIndexOf("@");
  if (at <= 0 || at === value.length - 1) return null;
  const rawDomain = value.slice(at + 1);
  // Titik di ujung ("gmail.com.") tidak bisa menerima email.
  const domain = rawDomain.replace(/\.+$/, "");
  const suggestion = suggestEmailDomain(domain) ?? (domain !== rawDomain && domain ? domain : null);
  if (!suggestion) return null;
  return `${value.slice(0, at)}@${suggestion}`;
}

/**
 * Kalimat penolakan untuk pendaftar, atau `null` bila email tidak tampak salah
 * ketik. `subject` contoh: "Email pemesan", "Email Peserta 2".
 */
export function emailTypoProblem(email: string, subject = "Email"): string | null {
  const suggestion = suggestEmailCorrection(email);
  if (!suggestion) return null;
  return `${subject} sepertinya salah ketik. Maksud Anda ${suggestion}?`;
}
