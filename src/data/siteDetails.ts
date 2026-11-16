export const siteDetails = {
    siteName: 'SMADARUN 2027',
    // Wajib `www`: smadarun.id dialihkan (308) ke www. Canonical/sitemap yang menunjuk ke
    // host yang beralih membuat Google ragu mana URL yang harus diindeks.
    siteUrl: 'https://www.smadarun.id/',
    metadata: {
        title: 'SMADARUN 2027 — Sambut Energi Baru | Run Event SMAN 2 Nganjuk',
        // ≤155 karakter: lebih panjang dari itu dipotong di hasil Google dan kartu pratinjau WhatsApp.
        description: 'Satu garis start, banyak cerita baru. SMADARUN 2027, run event tahunan SMA Negeri 2 Nganjuk untuk semua pelari. Siapkan sepatumu, kita start bareng!',
    },
    language: 'id-id',
    locale: 'id-ID',
    siteLogo: `${process.env.BASE_PATH || ''}/images/logo.png`, // or use a string for the logo e.g. "TechStartup"
    googleAnalyticsId: '', // e.g. G-XXXXXXX,
}