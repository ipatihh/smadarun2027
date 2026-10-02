// Versi teks persetujuan yang ditampilkan formulir /daftar — dikirim ke core sebagai
// `consent_policy_version` dan disimpan core di registration_orders.consent_json
// (kembarin-v2 docs/PARTNER_INTEGRATION.md §9).
//
// "Teks persetujuan" = kalimat kedua kotak centang di DaftarForm (kesehatan & Kebijakan
// Privasi) DAN isi src/components/legal/IsiKebijakanPrivasi.tsx.
//
// SETIAP KALI salah satu teks itu berubah:
//   1. buat label baru (pola ^[A-Za-z0-9._-]{1,32}$, mis. "smadarun-2027-01"),
//   2. jadikan VERSI_PERSETUJUAN, dan
//   3. TAMBAHKAN ke VERSI_PERSETUJUAN_DIKENAL — jangan hapus label lama: tab yang dibuka
//      sebelum deploy masih menampilkan (dan mengirim) teks versi lama, dan catatannya
//      harus menyebut versi yang benar-benar dibaca pendaftar itu.

export const VERSI_PERSETUJUAN = "smadarun-2026-10";

/** Semua label yang pernah dipakai. Urutan: yang tertua di depan. */
export const VERSI_PERSETUJUAN_DIKENAL: readonly string[] = ["smadarun-2026-10"];

/**
 * Tab yang dibuka sebelum label ini ada tidak mengirim `consent_policy_version`. Teks yang
 * mereka tampilkan identik dengan label pertama, jadi kiriman tanpa label dicatat begitu.
 */
export const VERSI_PERSETUJUAN_TANPA_LABEL = VERSI_PERSETUJUAN_DIKENAL[0];
