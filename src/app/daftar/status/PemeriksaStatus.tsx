"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { FiCheckCircle, FiClock, FiRefreshCw, FiXCircle, FiAlertTriangle } from "react-icons/fi";
import {
  bacaPesananTerakhir,
  HasilStatus,
  KUNCI_SESI_PESANAN,
  lupakanPesananTerakhir,
  PesananTersimpan,
  tafsirkanResponsStatus,
  urlPaymentReturn,
} from "@/lib/statusPesanan";

// sessionStorage dibaca lewat useSyncExternalStore: render server & hidrasi memakai null
// (HTML statis tetap sama), lalu browser memakai nilai sebenarnya tanpa setState di effect.
const berlangganan = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const bacaMentah = () => {
  try {
    return window.sessionStorage.getItem(KUNCI_SESI_PESANAN);
  } catch {
    return null;
  }
};

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
 * Status pesanan terakhir yang dibuat dari TAB INI (kode + token di sessionStorage).
 * Tanpa token (tab lama, atau core belum memasang ORDER_STATUS_TOKEN_SECRET) pendaftar
 * diarahkan ke halaman payment-return kembar.in, yang bisa dibuka cukup dengan kode.
 * Tidak ada pemeriksaan berkala otomatis — "Periksa lagi" ditekan pengguna.
 */
export default function PemeriksaStatus() {
  const mentah = useSyncExternalStore(berlangganan, bacaMentah, () => null);
  const [dilupakan, setDilupakan] = useState(false);
  // `mentah` dipakai sebagai pemicu: isi yang sama → objek yang sama → effect tidak berulang.
  const tersimpan = useMemo(() => (mentah ? bacaPesananTerakhir() : null), [mentah]);
  const pesanan = dilupakan ? null : tersimpan;
  // null = belum ada hasil (ditampilkan sebagai "memeriksa" bila ada token).
  const [hasil, setHasil] = useState<HasilStatus | "memeriksa" | null>(null);

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

  const periksaLagi = async (p: PesananTersimpan) => {
    setHasil("memeriksa");
    setHasil(await ambilStatus(p));
  };

  if (!pesanan) return null;

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
    if (order.status === "paid") {
      isi = (
        <Judul ikon={<FiCheckCircle />} warna="success" judul="Pembayaran diterima">
          Bukti pendaftaran dikirim ke email pemesan. Periksa juga folder Spam atau Promosi.
        </Judul>
      );
    } else if (order.status === "pending") {
      isi = (
        <>
          <Judul ikon={<FiClock />} warna="warning" judul="Menunggu pembayaran">
            {order.paymentExpiresAt ? <>Selesaikan sebelum {formatWib(order.paymentExpiresAt)}.</> : "Pesanan belum dibayar."}
          </Judul>
          {order.paymentUrl ? (
            <a href={order.paymentUrl} rel="noopener noreferrer" className={`mt-4 ${tombolUtama}`}>
              Lanjutkan pembayaran
            </a>
          ) : (
            <div className="mt-3">{tautanKembarIn}</div>
          )}
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
    <section aria-labelledby="status-pesanan-judul" className="mt-8 rounded-field border border-border bg-surface-sunken p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="status-pesanan-judul" className="text-sm font-bold text-foreground">
          Pesanan terakhir dari perangkat ini
        </h2>
        <span className="font-mono text-sm font-semibold text-foreground">{pesanan.kode}</span>
      </div>
      <div aria-live="polite">{isi}</div>
      <button
        type="button"
        onClick={() => {
          lupakanPesananTerakhir();
          setDilupakan(true);
        }}
        className="mt-4 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded"
      >
        Lupakan pesanan ini di perangkat ini
      </button>
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
