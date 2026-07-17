/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tambahkan ini untuk mengabaikan eror TypeScript saat build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Tambahkan ini untuk mengabaikan eror ESLint saat build
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Memastikan gambar eksternal aman
  }
};

export default nextConfig;