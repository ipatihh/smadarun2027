// Catatan: script-src memakai 'unsafe-inline' (bukan nonce/'strict-dynamic') supaya halaman tetap
// bisa di-static-generate (Next.js App Router butuh headers() dinamis per-request untuk nonce,
// yang memaksa seluruh halaman jadi server-rendered). Aman untuk app ini karena tidak ada
// dangerouslySetInnerHTML/eval, dan React sudah meng-escape semua output secara default.
const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Optimasi bawaan Next aktif (resize + WebP/AVIF). Sebelumnya dimatikan total,
    // sehingga foto sample berukuran megabyte dikirim apa adanya ke pengunjung mobile.
    // Semua gambar di sini lokal (folder /public), tidak ada host eksternal yang perlu
    // di-allowlist.
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
  },
  async headers() {
    return [
      {
        // Berlaku untuk seluruh route (halaman & API)
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: ContentSecurityPolicy },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;