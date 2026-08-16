// Satu-satunya titik baca data event/tiket live dari core system kembarin-v2.
// Dipakai oleh homepage (kartu harga), form /daftar, dan validasi server di
// api/daftar/route.ts — supaya perubahan yang admin buat di dasbor Super Admin
// kembarin-v2 (harga, kategori, status buka/tutup) otomatis berlaku di sini
// tanpa perlu redeploy atau ubah kode di project ini.

const EVENT_CODE = "smadarun";

export interface LiveTicketType {
  categoryKey: string; // = category_name di admin kembarin-v2
  price: number;
}

export interface ResolvedTicketTier extends LiveTicketType {
  name: string;
  features: string[];
  url: string;
  isAvailable: boolean;
}

export interface LiveEventData {
  // true hanya kalau event berstatus "active" DI kembarin-v2 DAN ada minimal satu
  // kategori tiket tersedia. Ini gerbang utama buka/tutup pendaftaran di UI.
  isOpen: boolean;
  // Daftar kategori tiket apa adanya dari kembarin-v2 (tetap diisi walau isOpen
  // false, supaya UI masih bisa menampilkan kategori dalam keadaan nonaktif/"Tidak
  // Tersedia" alih-alih menghilang total).
  ticketTypes: LiveTicketType[];
}

const CLOSED: LiveEventData = { isOpen: false, ticketTypes: [] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export async function getLiveEventData(): Promise<LiveEventData> {
  const publicEventsUrl =
    process.env.KEMBAR_IN_PUBLIC_EVENTS_URL || "https://kembar.in/api/public/events";

  try {
    const res = await fetch(publicEventsUrl, {
      // Data ini tidak butuh instan-real-time (core tetap jadi validator akhir saat
      // submit), tapi tetap harus "hidup" — revalidate pendek supaya perubahan admin
      // terlihat di sini dalam hitungan detik tanpa membebani kembar.in tiap request.
      next: { revalidate: 30 },
    });
    if (!res.ok) return CLOSED;

    const json: unknown = await res.json();
    if (!isRecord(json) || json.success !== true || !Array.isArray(json.data)) return CLOSED;

    const event = json.data.find(
      (item) => isRecord(item) && item.event_code === EVENT_CODE
    ) as Record<string, unknown> | undefined;
    if (!event) return CLOSED;

    const rawTicketTypes = Array.isArray(event.ticket_types) ? event.ticket_types : [];
    const ticketTypes: LiveTicketType[] = rawTicketTypes
      .filter(isRecord)
      .map((row) => ({
        categoryKey: typeof row.category_name === "string" ? row.category_name.trim() : "",
        price: Number(row.price) || 0,
      }))
      .filter((t) => t.categoryKey.length > 0 && t.price > 0);

    return {
      isOpen: event.status === "active" && ticketTypes.length > 0,
      ticketTypes,
    };
  } catch (err) {
    console.error("[kembarinEvents] Gagal mengambil data event live dari kembarin-v2:", err);
    // Gagal fetch = anggap tertutup. Lebih aman menolak pendaftaran sementara
    // daripada memakai harga/kategori yang sudah usang atau tidak terverifikasi.
    return CLOSED;
  }
}
