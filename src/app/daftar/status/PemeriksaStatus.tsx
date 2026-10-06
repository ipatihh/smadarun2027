"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { FiCheckCircle, FiClock, FiRefreshCw, FiXCircle, FiAlertTriangle, FiMail } from "react-icons/fi";
import {
  bacaDaftarPesanan,
  HasilStatus,
  JEDA_PERIKSA_ULANG_MS,
  kodeDariKueri,
  KUNCI_PESANAN,
  lupakanPesanan,
  pindahkanPesananSesiLama,
  perluPeriksaUlang,
  PesananTersimpan,
  pilihPesananTampil,
  tafsirkanResponsStatus,
  StatusTerverifikasi,
  urlPaymentReturn,
} from "@/lib/statusPesanan";
import { siteDetails } from "@/data/siteDetails";

// localStorage dibaca lewat useSyncExternalStore: render server & hidrasi memakai null
// (HTML statis tetap sama), lalu browser memakai nilai sebenarnya tanpa setState di effect.
// Event `storage` juga datang dari tab lain, jadi pesanan baru di tab lain ikut terbaca.
const berlangganan = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
let sesiLamaDipindahkan = false;
const bacaMentah = () => {
  try {
    // Tab yang terbuka sebelum rilis menyimpan pesanannya di sessionStorage; pindahkan sekali.
    if (!sesiLamaDipindahkan) {
      sesiLamaDipindahkan = true;
      pindahkanPesananSesiLama(window.sessionStorage, window.localStorage);
    }
    return window.localStorage.getItem(KUNCI_PESANAN);
  } catch {
    return null;
  }
};
// `?order=` dari tujuan kembali gateway. URL tidak berubah selama halaman terbuka.
const tanpaLangganan = () => () => {};
const bacaKodeKembali = () => kodeDariKueri(window.location.search);

const BATAS_TUNGGU_MS = 15_000; // > batas api/status-pesanan (10 dtk)

/** Satu pemeriksaan ke api/status-pesanan. Tidak mengubah state; tanpa pengulangan otomatis. */
async function ambilStatus(p: PesananTersimpan): Promise<HasilStatus> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), BATAS_TUNGGU_MS);
  try {
    const res = await fetch("/api/status-pesanan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderCode: p.kode, statusToken: p.statusToken }),
      signal: controller.signal,
    });
    return tafsirkanResponsStatus(res.status, res.headers.get("content-type"), await res.text(), window.location.origin);
  } catch {
    return { jenis: "gangguan" };
  } finally {
    window.clearTimeout(timer);
  }
}

function formatWib(iso: string): string {
  return (
    new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(
      new Date(iso)
    ) + " WIB"
  );
}

const tombolUtama =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-rest transition hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-card";
const tautanKedua =
  "text-sm font-semibold text-foreground underline underline-offset-4 hover:text-foreground-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded";

/**
 * Status pesanan terakhir yang dibuat dari PERAMBAN INI (kode + token di localStorage), juga
 * tujuan kembali gateway setelah bayar (`?order=<kode>`, lihat URL_KEMBALI_PEMBAYARAN).
 * Tanpa token (perangkat/peramban lain, lewat masa simpan, atau core belum memasang
 * ORDER_STATUS_TOKEN_SECRET) pendaftar diarahkan ke halaman payment-return kembar.in, yang
 * bisa dibuka cukup dengan kode. Pemeriksaan otomatis berulang hanya sebentar setelah
 * kembali dari gateway (perluPeriksaUlang); selebihnya "Periksa lagi" ditekan pengguna.
 */
export default function PemeriksaStatus({ pengantar, panduan }: { pengantar: React.ReactNode; panduan: React.ReactNode }) {
  const mentah = useSyncExternalStore(berlangganan, bacaMentah, () => null);
  const kodeKembali = useSyncExternalStore(tanpaLangganan, bacaKodeKembali, () => null);
  const [dilupakan, setDilupakan] = useState(false);
  // `mentah` dipakai sebagai pemicu: isi yang sama → objek yang sama → effect tidak berulang.
  const daftar = useMemo(() => (mentah ? bacaDaftarPesanan() : []), [mentah]);
  const tampil = useMemo(() => pilihPesananTampil(daftar, kodeKembali), [daftar, kodeKembali]);
  const pesanan = dilupakan ? null : (tampil?.pesanan ?? null);
  const dariGateway = tampil?.dariGateway === true;
  // null = belum ada hasil (ditampilkan sebagai "memeriksa" bila ada token).
  const [hasil, setHasil] = useState<HasilStatus | "memeriksa" | null>(null);
  const [sudahDiulang, setSudahDiulang] = useState(0);

  useEffect(() => {
    if (!pesanan?.statusToken) return;
    let batal = false;
    void ambilStatus(pesanan).then((h) => {
      if (!batal) setHasil(h);
    });
    return () => {
      batal = true;
    };
  }, [pesanan]);

  // Baru kembali dari gateway: `pending` diperiksa ulang sebentar tanpa menghapus tampilan.
  useEffect(() => {
    if (!pesanan || hasil === "memeriksa" || !perluPeriksaUlang(hasil, dariGateway, sudahDiulang)) return;
    let batal = false;
    const timer = window.setTimeout(() => {
      void ambilStatus(pesanan).then((h) => {
        if (batal) return;
        setSudahDiulang((n) => n + 1);
        setHasil(h);
      });
    }, JEDA_PERIKSA_ULANG_MS);
    return () => {
      batal = true;
      window.clearTimeout(timer);
    };
  }, [pesanan, hasil, dariGateway, sudahDiulang]);

  const periksaLagi = async (p: PesananTersimpan) => {
    setHasil("memeriksa");
    setHasil(await ambilStatus(p));
  };

  if (!pesanan) {
    return (
      <>
        {pengantar}
        {panduan}
      </>
    );
  }

  // Lunas: ringkasan pembayaran menggantikan pengantar & panduan (sama dengan kembar.in).
  if (hasil !== null && hasil !== "memeriksa" && hasil.jenis === "ada" && hasil.order.status === "paid") {
    return <RingkasanLunas kode={pesanan.kode} order={hasil.order} />;
  }

  const tautanKembarIn = (
    <a href={urlPaymentReturn(pesanan.kode)} target="_blank" rel="noopener noreferrer" className={tautanKedua}>
      Lihat status pesanan di kembar.in
    </a>
  );

  let isi: React.ReactNode;
  if (!pesanan.statusToken) {
    isi = (
      <>
        <p className="text-sm text-foreground-accent">
          Status pesanan ini belum bisa diperiksa langsung dari situs ini.
        </p>
        <div className="mt-3">{tautanKembarIn}</div>
      </>
    );
  } else if (hasil === "memeriksa" || hasil === null) {
    isi = (
      <p className="flex items-center gap-2 text-sm text-foreground-accent" role="status">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary-accent" aria-hidden="true" />
        Memeriksa status pesanan…
      </p>
    );
  } else if (hasil.jenis === "ada") {
    const { order } = hasil;
    if (order.status === "pending") {
      const batas = order.paymentExpiresAt ? ` sebelum ${formatWib(order.paymentExpiresAt)}` : "";
      // Kembali dari gateway tidak berarti sudah membayar (bisa baru memilih metode bayar),
      // jadi kedua kemungkinan disebut tanpa menebak.
      const sudahBayar = perluPeriksaUlang(hasil, dariGateway, sudahDiulang)
        ? "Sudah membayar? Status diperbarui otomatis dalam beberapa saat."
        : "Sudah membayar? Konfirmasi bisa butuh beberapa menit; tekan Periksa lagi.";
      isi = (
        <>
          <Judul ikon={<FiClock />} warna="warning" judul="Menunggu pembayaran">
            {dariGateway
              ? `${sudahBayar} Belum? Selesaikan${batas}.`
              : batas
                ? `Selesaikan${batas}.`
                : "Pesanan belum dibayar."}
          </Judul>
          {order.paymentUrl ? (
            <a href={order.paymentUrl} rel="noopener noreferrer" className={`mt-4 ${tombolUtama}`}>
              Lanjutkan pembayaran
            </a>
          ) : (
            <div className="mt-3">{tautanKembarIn}</div>
          )}
          <button
            type="button"
            onClick={() => void periksaLagi(pesanan)}
            className={`mt-3 inline-flex items-center gap-1.5 ${tautanKedua}`}
          >
            <FiRefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Periksa lagi
          </button>
        </>
      );
    } else if (order.status === "expired") {
      isi = (
        <Judul ikon={<FiXCircle />} warna="danger" judul="Batas pembayaran terlewat">
          Pesanan ini tidak bisa dibayar lagi.{" "}
          <Link href="/daftar" className={tautanKedua}>
            Daftar ulang
          </Link>
        </Judul>
      );
    } else {
      isi = (
        <Judul ikon={<FiXCircle />} warna="danger" judul="Pesanan dibatalkan">
          Bila Anda sudah membayar pesanan ini, hubungi panitia dengan kode di atas.
        </Judul>
      );
    }
  } else {
    const teks: Record<string, string> = {
      "tidak-ada": "Pesanan tidak ditemukan.",
      "tidak-valid": "Data pesanan di perangkat ini tidak valid.",
      "belum-aktif": "Pemeriksaan status otomatis belum tersedia.",
      dibatasi: "Terlalu banyak pemeriksaan. Coba lagi sebentar lagi.",
      gangguan: "Status pesanan belum dapat diperiksa saat ini.",
    };
    const bisaUlang = hasil.jenis === "gangguan" || hasil.jenis === "dibatasi";
    isi = (
      <>
        <Judul ikon={<FiAlertTriangle />} warna="warning" judul={teks[hasil.jenis]}>
          Status resmi tetap bisa dilihat di kembar.in dengan kode pesanan ini.
        </Judul>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          {tautanKembarIn}
          {bisaUlang && (
            <button
              type="button"
              onClick={() => void periksaLagi(pesanan)}
              className={`inline-flex items-center gap-1.5 ${tautanKedua}`}
            >
              <FiRefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Periksa lagi
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
    {pengantar}
    <section aria-labelledby="status-pesanan-judul" className="mt-8 rounded-field border border-border bg-surface-sunken p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="status-pesanan-judul" className="text-sm font-bold text-foreground">
          {!tampil?.dariPenyimpanan
            ? "Pesanan dari halaman pembayaran"
            : tampil.dariGateway
              ? "Pesanan dari perangkat ini"
              : "Pesanan terakhir dari perangkat ini"}
        </h2>
        <span className="font-mono text-sm font-semibold text-foreground">{pesanan.kode}</span>
      </div>
      <div aria-live="polite">{isi}</div>
      {tampil?.dariPenyimpanan && (
        <button
          type="button"
          onClick={() => {
            lupakanPesanan(pesanan.kode);
            setDilupakan(true);
          }}
          className="mt-4 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded"
        >
          Lupakan pesanan ini di perangkat ini
        </button>
      )}
    </section>
    {panduan}
    </>
  );
}

const formatRupiah = (nilai: number) => `Rp ${nilai.toLocaleString("id-ID")}`;

/**
 * Halaman sukses — bentuk dan kalimatnya mengikuti halaman payment-return kembar.in: ikon,
 * judul, satu kalimat, lalu ringkasan dalam garis tipis (Event, Kode pesanan, Total, Metode).
 * Total & metode datang dari core (status pesanan §8); yang tidak dikirim core tidak ditampilkan.
 */
function RingkasanLunas({ kode, order }: { kode: string; order: StatusTerverifikasi }) {
  const baris: Array<[string, React.ReactNode]> = [
    ["Event", siteDetails.siteName],
    ["Kode pesanan", <span key="kode" className="font-mono text-xs">{kode}</span>],
  ];
  if (order.totalAmount !== undefined) baris.push(["Total", <span key="total" className="tabular-nums">{formatRupiah(order.totalAmount)}</span>]);
  if (order.paymentMethod) baris.push(["Metode", <span key="metode" className="uppercase">{order.paymentMethod}</span>]);

  return (
    <section aria-labelledby="status-pesanan-judul" aria-live="polite">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-success/30 bg-success-surface text-success">
        <FiCheckCircle className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 id="status-pesanan-judul" className="mt-6 font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">
        Pembayaran terverifikasi
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-foreground-accent">
        {order.ticketCount ? `${order.ticketCount} tiket telah diamankan. ` : ""}
        Konfirmasi dan e-ticket dikirim ke email pemesan.
      </p>
      <dl className="mt-7 divide-y divide-border border-y border-border text-sm">
        {baris.map(([label, nilai]) => (
          <div key={label} className="flex items-center justify-between gap-5 py-3">
            <dt className="text-foreground-accent">{label}</dt>
            <dd className="text-right font-bold text-foreground">{nilai}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex items-start gap-3 rounded-field border border-border bg-surface-sunken p-4 text-xs leading-5 text-foreground-accent">
        <FiMail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Email belum masuk? Periksa folder spam, atau buka tiket di{" "}
          <a href="https://kembar.in/me/event/smadarun" target="_blank" rel="noopener noreferrer" className={tautanKedua}>
            Portal Peserta kembar.in
          </a>{" "}
          dengan masuk memakai email pemesan.
        </span>
      </div>
    </section>
  );
}

function Judul({
  ikon,
  warna,
  judul,
  children,
}: {
  ikon: React.ReactNode;
  warna: "success" | "warning" | "danger";
  judul: string;
  children: React.ReactNode;
}) {
  const kelas = { success: "text-success", warning: "text-warning", danger: "text-danger" }[warna];
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 h-5 w-5 shrink-0 ${kelas}`} aria-hidden="true">
        {ikon}
      </span>
      <div>
        <p className="font-semibold text-foreground">{judul}</p>
        <p className="mt-1 text-sm leading-relaxed text-foreground-accent">{children}</p>
      </div>
    </div>
  );
}
