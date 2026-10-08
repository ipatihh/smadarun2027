export const siteDetails = {
    siteName: 'SMADARUN 2027',
    // Wajib `www`: smadarun.id dialihkan (308) ke www. Canonical/sitemap yang menunjuk ke
    // host yang beralih membuat Google ragu mana URL yang harus diindeks.
    siteUrl: 'https://www.smadarun.id/',
    metadata: {
        title: 'SMADARUN 2027 - Lomba Lari SMA Negeri 2 Nganjuk',
        description: 'SMADARUN 2027 adalah ajang lari tahunan yang dipersembahkan oleh SMA Negeri 2 Nganjuk. Terbuka untuk umum dan pelari dari mana saja. Rayakan semangat olahraga, kebersamaan, dan kompetisi sehat.',
    },
    language: 'id-id',
    locale: 'id-ID',
    siteLogo: `${process.env.BASE_PATH || ''}/images/logo.png`, // or use a string for the logo e.g. "TechStartup"
    googleAnalyticsId: '', // e.g. G-XXXXXXX,
}