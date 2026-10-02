# AGENTS.md

Instruksi untuk agent coding apa pun (Codex, Claude, dll.) yang bekerja di repo ini.

1. Baca **`CLAUDE.md`** — aturan wajib proyek ini. Namanya CLAUDE.md, tetapi isinya berlaku
   untuk semua agent.
2. Lanjutkan ke **`docs/README.md`** — urutan baca, peta modul, kontrak dengan core kembarin-v2,
   cara menguji dengan aman, dan catatan perubahan.

Ringkas yang paling sering terlupa:

- kembarin-v2 adalah sumber kebenaran harga, kategori, status pendaftaran, dan pembayaran.
  Kontraknya: kembarin-v2 `docs/PARTNER_INTEGRATION.md`; sisi situs ini: `docs/INTEGRASI_CORE.md`.
- Push ke `main` = deploy production otomatis (`www.smadarun.id`). Jangan push/merge/deploy tanpa
  izin pemilik.
- Jangan pernah mengirim payload pendaftaran valid ke core production; uji dengan
  `scripts/mock-core.mjs` sesuai `docs/PENGUJIAN.md`.
- Konten contoh (testimoni, statistik, kontak, foto) memang placeholder — jangan "dibetulkan".
- Perubahan di repo kembarin-v2 dikerjakan di sesi terpisah; dari sini cukup siapkan prompt.
