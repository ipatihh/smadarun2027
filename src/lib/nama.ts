/** Kapital saat mengetik; spasi akhir dipertahankan agar nama berikutnya bisa diketik. */
export function kapitalNama(value: string): string {
  return value.toUpperCase();
}

/** Bentuk final nama untuk blur, ringkasan, dan pengiriman ke core. */
export function rapikanNama(value: string): string {
  return kapitalNama(value).replace(/\s+/g, " ").trim();
}
