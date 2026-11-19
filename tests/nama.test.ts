import { describe, expect, it } from "vitest";
import { kapitalNama, rapikanNama } from "@/lib/nama";
import { bacaKolomTambahan, rapikanIsian } from "@/lib/kolomTambahan";

describe("normalisasi nama", () => {
  it("mempertahankan spasi saat mengetik, merapikan spasi saat selesai", () => {
    expect(kapitalNama("siti ")).toBe("SITI ");
    expect(rapikanNama("  siti\t a.  o'neil\n")).toBe("SITI A. O'NEIL");
    expect(rapikanNama("   ")).toBe("");
  });

  it("hanya merapikan nama kontak darurat, tidak mengubah email, pilihan, atau teks lain", () => {
    const fields = bacaKolomTambahan([
      { name: "emergency_contact_name", label: "Emergency Contact Name", type: "text", semantic: null },
      { name: "darurat_email", label: "Email Kontak Darurat", type: "email", semantic: null },
      { name: "hubungan", label: "Hubungan", type: "select", options: ["Orang tua"], semantic: null },
      { name: "catatan", label: "Catatan", type: "text", semantic: null },
    ]);
    expect(rapikanIsian(fields[0], "  ibu   siti ")).toBe("IBU SITI");
    expect(rapikanIsian(fields[1], "User@contoh.test")).toBe("User@contoh.test");
    expect(rapikanIsian(fields[2], "Orang tua")).toBe("Orang tua");
    expect(rapikanIsian(fields[3], "Catatan peserta")).toBe("Catatan peserta");
  });
});
