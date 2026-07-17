/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";

interface FormDataState {
  nama: string;
  email: string;
  nik: string;
  whatsapp: string;
  gender: string;
  kota: string;
  kategori: string;
  nominal: number;
  size: string;
}

type SubmitData = FormDataState & {
  eventCode: string;
  file_data?: string;
  file_name?: string;
  fileData?: string;  // 🚀 Tambahan penyesuaian camelCase untuk backend kembar.in
  fileName?: string;  // 🚀 Tambahan penyesuaian camelCase untuk backend kembar.in
  custom_fields?: Record<string, any>;
};

  export default function DaftarPage() {
  // ALUR TERPUSAT: Mengarah langsung ke API Route internal Next.js (Secure API Proxy)
  const WEBHOOK_URL = "/api/daftar"; 
  const imageSrc = "/images/ivan-1.jpg"; 

  const [isHealthyChecked, setIsHealthyChecked] = useState<boolean>(false);
  const isFormClosed = false; 
  const [formData, setFormData] = useState<FormDataState>({
    nama: "",
    email: "",
    nik: "",
    whatsapp: "",
    gender: "", // Awalnya kosong wajib dipilih
    kota: "",
    kategori: "5K Pelajar",
    nominal: 150000,
    size: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isImgOpen, setIsImgOpen] = useState<boolean>(false);

  const [modal, setModal] = useState<{ show: boolean; success: boolean; title: string; message: string }>({
    show: false,
    success: false,
    title: "",
    message: "",
  });

  const handleKategoriChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const kategoriVal = e.target.value;
    const harga = e.target.options[e.target.selectedIndex].dataset.price;
    setFormData((prev) => ({ ...prev, kategori: kategoriVal, nominal: parseInt(harga || "0") }));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return; // Proteksi instan double submit dari klik brutal di frontend
    setLoading(true);

    // Pemetaan data yang diselaraskan secara presisi dengan skema backend & DB Aiven
    const outputObject: SubmitData = { 
      eventCode: "smadarun2027", 
      nama: formData.nama.trim(),
      email: formData.email.trim(),
      nik: formData.nik.trim(),
      whatsapp: formData.whatsapp.trim(),
      gender: formData.gender, // 🚀 Tersinkronisasi penuh dengan target kolom database
      kota: formData.kota.trim(),
      kategori: formData.kategori,
      nominal: formData.nominal + 3000, 
      size: formData.size,
      custom_fields: {}
    };

    const sendData = async (payload: SubmitData) => {
      try {
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        const result = await response.json();

        if (response.ok && result.success) {
          setModal({
            show: true,
            success: true,
            title: "Pendaftaran Berhasil!",
            message: "Data pendaftaran dan bukti transfer Anda telah aman tersimpan. Tim kami akan segera memverifikasi pembayaran Anda.",
          });
          
          // Reset form secara reaktif tanpa merusak state app
          setFormData({
            nama: "",
            email: "",
            nik: "",
            whatsapp: "",
            gender: "",
            kota: "",
            kategori: "5K Pelajar",
            nominal: 150000,
            size: "",
          });
          setFile(null);
          setIsHealthyChecked(false);
        } else {
          throw new Error(result.message || "Gagal menyimpan data");
        }
      } catch (err: any) {
        setModal({
          show: true,
          success: false,
          title: "Terjadi Kesalahan",
          message: err.message || "Gagal mengirim data pendaftaran. Silakan periksa koneksi atau coba beberapa saat lagi.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(",")[1];
        
        // 🚀 DISINKRONKAN DENGAN SKEMA CAMELCASE BACKEND KEMBAR.IN
        outputObject["fileData"] = base64Data; 
        outputObject["fileName"] = file.name;
        
        sendData(outputObject);
      };
      reader.readAsDataURL(file);
    } else {
      sendData(outputObject);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center items-center pb-12 pt-28 px-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      <div className="w-full max-w-xl z-10">
        <div className="text-center mb-8">
          <div className="font-extrabold text-3xl italic tracking-tight uppercase text-gray-900">SMADARUN <span className="text-[#FBBF24]">2027</span></div>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Official Registration Portal</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-xl text-gray-900">
          <h3 className="text-center font-black text-2xl tracking-tight text-gray-800 mb-8">FORMULIR PENDAFTARAN</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset disabled={isFormClosed} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Nama Lengkap</label>
              <input type="text" name="nama" value={formData.nama} onChange={handleInputChange} placeholder="Sesuai KTP / Kartu Pelajar" className="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:border-[#FCD34D] focus:ring-4 focus:ring-[#FCD34D]/20 outline-none transition" required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Alamat Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="contoh@email.com" className="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:border-[#FCD34D] focus:ring-4 focus:ring-[#FCD34D]/20 outline-none transition" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">NIK KTP / Kartu Pelajar</label>
                <input type="number" name="nik" value={formData.nik} onChange={handleInputChange} placeholder="16 digit angka" className="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:border-[#FCD34D] focus:ring-4 focus:ring-[#FCD34D]/20 outline-none transition" required />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Nomor WhatsApp</label>
                <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} placeholder="08xxxxx" className="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:border-[#FCD34D] focus:ring-4 focus:ring-[#FCD34D]/20 outline-none transition" required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Jenis Kelamin</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:border-[#FCD34D] outline-none transition" required>
                  <option value="" disabled>Pilih Jenis Kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Kota Domisili</label>
                <input type="text" name="kota" value={formData.kota} onChange={handleInputChange} placeholder="Contoh: Nganjuk" className="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:border-[#FCD34D] focus:ring-4 focus:ring-[#FCD34D]/20 outline-none transition" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Kategori Lomba</label>
              <select name="kategori" value={formData.kategori} onChange={handleKategoriChange} className="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:border-[#FCD34D] outline-none transition" required>
                <option value="5K Pelajar" data-price="150000">5K Pelajar - Rp 150.000</option>
                <option value="5K Umum" data-price="170000">5K Umum - Rp 170.000</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Ukuran Jersey (Unisex)</label>
              <select name="size" value={formData.size} onChange={handleInputChange} className="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:border-[#FCD34D] outline-none transition" required>
                <option value="" disabled>Pilih Ukuran</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
                <option value="XXXL">XXXL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Panduan Ukuran</label>
              <div className="p-2 bg-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                <img src={imageSrc} alt="Size Chart" className="w-full h-auto rounded-lg cursor-zoom-in opacity-90 hover:opacity-100 transition duration-300" onClick={() => setIsImgOpen(true)} />
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-2.5 text-sm">
              <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Rincian Biaya Pendaftaran</div>
              <div className="flex justify-between text-gray-600 font-medium">
                <span>Biaya Tiket ({formData.kategori})</span>
                <span>Rp {formData.nominal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-medium">
                <span>Biaya Layanan & Sistem</span>
                <span>Rp 3.000</span>
              </div>
              <div className="border-t border-gray-200 pt-2.5 flex justify-between font-black text-gray-900 text-base">
                <span>Total Pembayaran</span>
                <span className="text-amber-600">Rp {(formData.nominal + 3000).toLocaleString("id-ID")}</span>
              </div>
            </div>
            <div className="bg-amber-50/60 border border-dashed border-amber-300 p-6 rounded-xl text-center">
              <div className="text-xs font-black uppercase tracking-widest text-amber-700 mb-1">Metode Transfer Pembayaran</div>
              <div className="text-sm font-bold text-gray-700">BANK BCA</div>
              <div className="text-3xl font-black tracking-wider text-gray-900 my-1.5 font-mono">141XXXXXXX</div>
              <div className="text-xs font-semibold uppercase text-gray-500">A.N SMADA RUN OFFICIAL</div>
              <div className="mt-3 pt-3 border-t border-amber-200/60 text-xs font-bold text-gray-800">
                WAJIB TRANSFER SEBESAR: <span className="text-sm font-black text-amber-700">Rp {(formData.nominal + 3000).toLocaleString("id-ID")}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Unggah Bukti Pembayaran</label>
              <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="w-full text-sm text-gray-700 file:border-0 file:bg-[#FCD34D] file:px-4 file:py-2 file:rounded-xl file:text-sm file:font-semibold file:text-black bg-gray-50 border border-gray-300 rounded-xl outline-none transition" required />
              <p className="text-xs text-gray-500 mt-2">Unggah bukti transfer untuk mempercepat verifikasi pembayaran.</p>
            </div>
            <div className="flex items-start gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xl select-none">
              <input type="checkbox" id="healthDeclaration" checked={isHealthyChecked} onChange={(e) => setIsHealthyChecked(e.target.checked)} className="mt-0.5 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 accent-amber-500 cursor-pointer" />
              <label htmlFor="healthDeclaration" className="text-xs text-gray-600 leading-relaxed cursor-pointer font-medium">
                Saya menyatakan dengan sadar bahwa saya dalam kondisi <span className="font-bold text-gray-900">sehat walafiat</span>, memiliki fisik yang prima, and <span className="font-bold text-gray-900">bertanggung jawab penuh</span> atas keselamatan diri saya sendiri selama mengikuti seluruh rangkaian kegiatan SMADARUN 2027.
              </label>
            </div>
            <button type="submit" disabled={loading || isFormClosed || !isHealthyChecked} className="w-full py-4 bg-[#FCD34D] hover:bg-[#FBBF24] text-black font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:bg-gray-200 disabled:text-gray-400 disabled:transform-none disabled:cursor-not-allowed flex justify-center items-center gap-3">
              <span>{loading ? "MENGUNGGAH & MENYIMPAN..." : "KONFIRMASI PENDAFTARAN"}</span>
              {loading && <div className="w-5 h-5 border-3 border-black/20 border-t-black rounded-full animate-spin"></div>}
            </button>
            </fieldset>
          </form>
        </div>
      </div>

      {isImgOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300" onClick={() => setIsImgOpen(false)}>
          <div className="relative max-w-2xl w-full flex flex-col items-center">
            <button onClick={() => setIsImgOpen(false)} className="absolute -top-12 right-2 text-white/80 hover:text-white text-3xl font-bold transition focus:outline-none">&times;</button>
            <img src={imageSrc} alt="Size Chart Expanded" className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}

      {modal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl border border-gray-100">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl ${modal.success ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>{modal.success ? "✓" : "✕"}</div>
            <h4 className="text-xl font-black text-gray-900 mb-2">{modal.title}</h4>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{modal.message}</p>
            
            <button onClick={() => setModal((prev) => ({ ...prev, show: false }))} className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl w-full transition">Selesai</button>
          </div>
        </div>
      )}
    </div>
  );
}