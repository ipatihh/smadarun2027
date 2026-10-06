#!/bin/bash
# Membuat favicon dari SATU gambar persegi (PNG, ideal 512x512, latar transparan boleh).
#
# Pemakaian:   bash scripts/pasang-ikon.sh path/ke/ikon.png
#
# Hasil (menimpa berkas lama), dikenali otomatis oleh Next.js:
#   src/app/icon.png        512x512   favicon tab browser modern
#   src/app/apple-icon.png  180x180   ikon layar utama iPhone/iPad
#   src/app/favicon.ico      32x32    cadangan untuk browser lama
# Hanya butuh `sips` (bawaan macOS). Folder tujuan bisa diganti: OUT=folder bash scripts/...
set -euo pipefail

SRC="${1:-}"
OUT="${OUT:-src/app}"

if [ -z "$SRC" ] || [ ! -f "$SRC" ]; then
  echo "Pemakaian: bash scripts/pasang-ikon.sh path/ke/ikon.png" >&2
  exit 1
fi

W=$(sips -g pixelWidth "$SRC" | awk '/pixelWidth/ {print $2}')
H=$(sips -g pixelHeight "$SRC" | awk '/pixelHeight/ {print $2}')
if [ "$W" != "$H" ]; then
  echo "Gambar harus persegi (sekarang ${W}x${H}). Potong dulu agar lebar = tinggi." >&2
  exit 1
fi

sips -s format png -z 512 512 "$SRC" --out "$OUT/icon.png" >/dev/null
sips -s format png -z 180 180 "$SRC" --out "$OUT/apple-icon.png" >/dev/null
sips -s format ico -z 32 32 "$SRC" --out "$OUT/favicon.ico" >/dev/null
echo "Selesai: $OUT/icon.png, $OUT/apple-icon.png, $OUT/favicon.ico"
