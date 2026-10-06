import { getLiveEventData } from "@/lib/kembarinEvents";
import Countdown from "./Countdown";

/**
 * Panel "hari lomba": hitung mundur + fakta hari-H (tanggal, lokasi, gun start, RPC),
 * semuanya live dari kembarin-v2.
 *
 * Menggantikan dua seksi terpisah (panel countdown dan "Susunan Acara"). Selagi panitia
 * baru mengisi sebagian data, keduanya tampil sebagai blok besar yang nyaris kosong —
 * satu panel penuh untuk "tanggal segera diumumkan" dan satu seksi penuh untuk satu baris
 * jam gun start. Sekarang setiap fakta hanya muncul kalau datanya ada, di satu tempat.
 */

function formatJam(raw: string): string {
  const match = raw.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]} WIB` : raw;
}

function formatTanggal(raw: string): string | null {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

interface Fakta {
  label: string;
  value: string;
  detail?: string | null;
}

async function EventInfo() {
  const live = await getLiveEventData();

  const fakta: Fakta[] = [];

  const tanggal = live.eventDate ? formatTanggal(live.eventDate) : null;
  if (tanggal) fakta.push({ label: "Tanggal", value: tanggal });
  if (live.location) fakta.push({ label: "Lokasi", value: live.location });

  if (live.timeline) {
    const { rpcTanggal, rpcWaktu, rpcLokasi, gunStarts } = live.timeline;

    // Hanya jarak yang kategorinya memang dijual — gun start kategori yang sudah
    // dinonaktifkan admin tidak ikut tampil.
    const jarakAktif = live.ticketTypes.map((t) => t.categoryKey.toUpperCase());
    for (const [jarak, jam] of Object.entries(gunStarts)) {
      if (jarakAktif.some((kategori) => kategori.includes(jarak.toUpperCase()))) {
        fakta.push({ label: `Gun start ${jarak}`, value: formatJam(jam) });
      }
    }

    const waktuRpc = [rpcTanggal, rpcWaktu].filter(Boolean).join(", ");
    if (waktuRpc || rpcLokasi) {
      fakta.push({
        label: "Ambil race pack",
        value: waktuRpc || (rpcLokasi as string),
        detail: waktuRpc ? rpcLokasi : null,
      });
    }
  }

  const adaFakta = fakta.length > 0;

  return (
    <section id="jadwal" aria-labelledby="jadwal-judul" className="relative z-20 -mt-10 px-5 sm:-mt-14">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-panel border border-on-secondary/10 bg-secondary px-6 py-8 text-on-secondary shadow-hover sm:px-10 sm:py-10">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-28 h-72 w-72 rounded-full border border-primary/20"
        />

        <div className={`relative grid gap-8 ${adaFakta ? "md:grid-cols-2 md:gap-10" : "text-center"}`}>
          <div>
            <h2 id="jadwal-judul" className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Menuju hari lomba
            </h2>
            <div className="mt-4">
              <Countdown eventDate={live.eventDate} centered={!adaFakta} />
            </div>
          </div>

          {adaFakta && (
            <dl className="divide-y divide-on-secondary/10 md:border-l md:border-on-secondary/10 md:pl-10">
              {fakta.map((item) => (
                <div key={item.label} className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <dt className="shrink-0 text-sm text-on-secondary-muted">{item.label}</dt>
                  <dd className="text-right font-semibold text-on-secondary">
                    {item.value}
                    {item.detail && (
                      <span className="block text-sm font-normal text-on-secondary-muted">{item.detail}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}

export default EventInfo;
