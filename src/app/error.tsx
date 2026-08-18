"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";

/**
 * Layar galat untuk seluruh route. Paling sering dipicu saat data live kembarin-v2
 * gagal/timeout — dan itulah kenapa pesannya menegaskan bahwa tidak ada pendaftaran
 * atau pembayaran yang terjadi: pengguna yang melihat error di tengah alur bayar
 * perlu kepastian itu lebih dulu sebelum diminta mencoba lagi.
 */
export default function ErrorHalaman({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Pesan error tidak ditampilkan mentah ke pengunjung; cukup dicatat di log.
    console.error("[app/error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-28">
      <div className="w-full max-w-md rounded-card border border-border bg-card p-8 text-center shadow-rest">
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-warning-surface text-warning"
          aria-hidden="true"
        >
          <FiAlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
          Halaman gagal dimuat
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground-accent">
          Sambungan ke sistem pendaftaran sedang bermasalah. <strong className="text-foreground">Tidak ada
          pendaftaran atau pembayaran yang terproses</strong> — data Anda aman.
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-extrabold uppercase tracking-wider text-on-primary shadow-rest transition-all hover:bg-primary-accent hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            Coba lagi
          </button>
          <Link
            href="/"
            className="w-full rounded-full border border-border-strong px-6 py-3.5 text-sm font-bold text-foreground transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            Kembali ke beranda
          </Link>
        </div>

        {error.digest && (
          <p className="mt-5 text-[11px] text-muted-foreground">
            Kode rujukan: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  );
}
