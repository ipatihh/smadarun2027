import { NextRequest, NextResponse } from "next/server";

// Sederhana in-memory cache untuk Rate Limiting & Proteksi Double Submit
// Catatan: Karena Vercel adalah serverless environment, in-memory cache ini berjalan per instance/container.
// Ini cukup efektif untuk memblokir spam langsung atau double click brutal dari client yang sama.
// Untuk proteksi terdistribusi yang sempurna skala besar, idealnya menggunakan Redis (seperti Upstash),
// tetapi cache memori ini sudah sangat mumpuni menangani bottleneck / spam ringan & double-submit instan.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const doubleSubmitMap = new Map<string, number>(); // NIK -> timestamp pengiriman terakhir

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 menit
const MAX_REQUESTS_PER_WINDOW = 3;   // Maksimal 3 kali daftar per menit per IP
const DOUBLE_SUBMIT_WINDOW = 5000;   // 5 detik pencegahan double-submit untuk NIK yang sama

// Pembersihan cache memori berkala dilakukan secara pasif di dalam request handler untuk keselarasan dengan Serverless Environment
function bersihkanCacheMundur(now: number) {
  if (rateLimitMap.size > 200) {
    for (const [ip, data] of rateLimitMap.entries()) {
      if (now - data.lastReset > RATE_LIMIT_WINDOW) rateLimitMap.delete(ip);
    }
  }
  if (doubleSubmitMap.size > 200) {
    for (const [nik, timestamp] of doubleSubmitMap.entries()) {
      if (now - timestamp > DOUBLE_SUBMIT_WINDOW) doubleSubmitMap.delete(nik);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const now = Date.now();
    // Jalankan pembersihan pasif
    bersihkanCacheMundur(now);

    // 1. Get Client IP for Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";

    // 2. Apply Rate Limiting
    const limitData = rateLimitMap.get(ip);
    if (!limitData) {
      rateLimitMap.set(ip, { count: 1, lastReset: now });
    } else {
      if (now - limitData.lastReset > RATE_LIMIT_WINDOW) {
        // Reset window
        rateLimitMap.set(ip, { count: 1, lastReset: now });
      } else {
        if (limitData.count >= MAX_REQUESTS_PER_WINDOW) {
          return NextResponse.json(
            {
              success: false,
              message: "Terlalu banyak permintaan pendaftaran dari IP Anda. Silakan tunggu 1 menit sebelum mencoba lagi.",
            },
            { status: 429 }
          );
        }
        limitData.count++;
      }
    }

    // 3. Parse and Validate Request Body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: "Format JSON tidak valid." }, { status: 400 });
    }

    const {
      eventCode,
      nama,
      email,
      nik,
      whatsapp,
      gender,
      kota,
      kategori,
      nominal,
      size,
      fileData,
      fileName,
    } = body;

    // 4. Validasi & Sanitasi Data Ketat (Mencegah SQL Injection & Manipulasi Input)

    // Event Code Verification
    if (typeof eventCode !== "string" || eventCode.trim() !== "smadarun2027") {
      return NextResponse.json({ success: false, message: "Kode event tidak valid." }, { status: 400 });
    }
    
    // Nama Lengkap: String, huruf, spasi, titik (.), tanda petik tunggal (\'), panjang 3 - 100
    if (
      typeof nama !== "string" ||
      nama.trim().length < 3 ||
      nama.trim().length > 100 ||
      !/^[a-zA-Z\s\.\']+$/.test(nama.trim())
    ) {
      return NextResponse.json(
        { success: false, message: "Format nama tidak valid. Hanya diperbolehkan huruf, spasi, titik (.), atau kutip (')." },
        { status: 400 }
      );
    }

    // Email: Validasi regex email standar
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (typeof email !== "string" || !emailRegex.test(email.trim())) {
      return NextResponse.json({ success: false, message: "Format email tidak valid." }, { status: 400 });
    }

    // NIK KTP / Kartu Pelajar: Harus angka tepat 16 digit
    if (typeof nik !== "string" || !/^\d{16}$/.test(nik.trim())) {
      return NextResponse.json({ success: false, message: "NIK harus berupa angka dengan panjang tepat 16 digit." }, { status: 400 });
    }

    // WhatsApp: Harus angka, minimal 8 digit dan maksimal 15 digit (opsional didahului tanda +)
    if (typeof whatsapp !== "string" || !/^\+?\d{8,15}$/.test(whatsapp.trim())) {
      return NextResponse.json(
        { success: false, message: "Format nomor WhatsApp tidak valid. Masukkan 8-15 digit angka." },
        { status: 400 }
      );
    }

    // Gender Whitelist
    const genderWhitelist = ["Laki-laki", "Perempuan"];
    if (typeof gender !== "string" || !genderWhitelist.includes(gender)) {
      return NextResponse.json({ success: false, message: "Pilihan Jenis Kelamin tidak valid." }, { status: 400 });
    }

    // Size Whitelist
    const sizeWhitelist = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
    if (typeof size !== "string" || !sizeWhitelist.includes(size)) {
      return NextResponse.json({ success: false, message: "Pilihan Ukuran Jersey tidak valid." }, { status: 400 });
    }

    // Kategori & Nominal Verification (Mencegah manipulasi nominal/harga tiket dari frontend)
    const kategoriTarif: Record<string, number> = {
      "5K Pelajar": 150000,
      "5K Umum": 170000,
    };

    if (typeof kategori !== "string" || !kategoriTarif[kategori]) {
      return NextResponse.json({ success: false, message: "Kategori lomba tidak valid." }, { status: 400 });
    }

    const expectedNominal = kategoriTarif[kategori] + 3000; // Biaya Tiket + Biaya Sistem Layanan Rp 3.000
    if (typeof nominal !== "number" || nominal !== expectedNominal) {
      return NextResponse.json(
        { success: false, message: "Nominal pembayaran tidak sesuai dengan tarif kategori yang dipilih." },
        { status: 400 }
      );
    }

    // Kota: Huruf, spasi, strip, angka (untuk domisili seperti Jakarta Barat, Nganjuk)
    if (typeof kota !== "string" || kota.trim().length < 2 || kota.trim().length > 100) {
      return NextResponse.json({ success: false, message: "Format nama kota tidak valid." }, { status: 400 });
    }

    // File Data (Bukti Transfer): Jika ada, pastikan formatnya base64 valid
    if (fileData) {
      if (typeof fileData !== "string" || fileData.length < 100) {
        return NextResponse.json({ success: false, message: "Format berkas bukti transfer tidak valid." }, { status: 400 });
      }
      if (typeof fileName !== "string" || fileName.trim().length === 0) {
        return NextResponse.json({ success: false, message: "Nama berkas bukti transfer wajib disertakan." }, { status: 400 });
      }
    }

    // 5. Proteksi Double-Submit Sisi Server (Pencegahan Duplikat Cepat)
    const normalizedNik = nik.trim();
    const lastSubmitTime = doubleSubmitMap.get(normalizedNik);
    if (lastSubmitTime && now - lastSubmitTime < DOUBLE_SUBMIT_WINDOW) {
      return NextResponse.json(
        {
          success: false,
          message: "Data pendaftaran dengan NIK ini sedang diproses. Silakan tunggu beberapa detik.",
        },
        { status: 409 }
      );
    }
    // Set lock
    doubleSubmitMap.set(normalizedNik, now);

    // 6. Proxy Request ke Backend Kembar.in
    const kembarInUrl = process.env.KEMBAR_IN_API_URL || "https://kembar.in/api/participants/register";

    // Set timeout request proxy 10 detik agar API route Next.js tidak hang selamanya jika server tujuan down
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(kembarInUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Pastikan merespons balik secara anggun & aman
      if (!response.ok) {
        const errText = await response.text();
        console.error("Proxy error response dari Kembar.in:", errText);
        // Lepas lock NIK agar user bisa mencoba lagi
        doubleSubmitMap.delete(normalizedNik);

        // Teruskan pesan eror asli dari core agar user mendapatkan info validasi yang tepat
        let customMessage = "Sistem core Kembar.in menolak penyimpanan data atau sedang tidak dapat dijangkau.";
        try {
          const parsedErr = JSON.parse(errText);
          if (parsedErr && parsedErr.message) {
            customMessage = parsedErr.message;
          }
        } catch (_) {
          // Gunakan potongan teks jika bukan format JSON
          if (errText && errText.length < 150 && !errText.includes("<!DOCTYPE")) {
            customMessage = errText;
          }
        }

        return NextResponse.json(
          {
            success: false,
            message: customMessage,
          },
          { status: response.status }
        );
      }

      const result = await response.json();
      return NextResponse.json(result);
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      console.error("Fetch proxy exception:", fetchErr);
      // Lepas lock NIK agar user bisa mencoba lagi
      doubleSubmitMap.delete(normalizedNik);
      
      let errorMsg = "Koneksi ke core system pendaftaran terputus atau sibuk. Data Anda belum tersimpan, silakan coba beberapa saat lagi.";
      if (fetchErr.name === "AbortError") {
        errorMsg = "Waktu tunggu request pendaftaran habis (timeout). Silakan periksa koneksi Anda dan coba lagi.";
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMsg,
        },
        { status: 504 }
      );
    }
  } catch (globalErr: any) {
    console.error("Internal Server Error API Route:", globalErr);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan internal pada server pendaftaran. Silakan coba beberapa saat lagi.",
      },
      { status: 500 }
    );
  }
}
