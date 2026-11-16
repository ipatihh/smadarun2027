export const siteDetails = {
    siteName: 'SMADARUN 2027',
    // Wajib `www`: smadarun.id dialihkan (308) ke www. Canonical/sitemap yang menunjuk ke
    // host yang beralih membuat Google ragu mana URL yang harus diindeks.
    siteUrl: 'https://www.smadarun.id/',
    metadata: {
        title: 'SMADARUN 2027 - Lomba Lari SMA Negeri 2 Nganjuk',
        // ≤155 karakter: lebih panjang dari itu dipotong di hasil Google dan kartu pratinjau WhatsApp.
        description: 'SMADARUN 2027: lomba lari tahunan SMA Negeri 2 Nganjuk, terbuka untuk umum. Pilih kategori, daftar online, dan rasakan serunya berlari bersama.',
    },
    language: 'id-id',
    locale: 'id-ID',
    siteLogo: `${process.env.BASE_PATH || ''}/images/logo.png`, // or use a string for the logo e.g. "TechStartup"
    googleAnalyticsId: '', // e.g. G-XXXXXXX,
}