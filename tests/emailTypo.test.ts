import { describe, expect, it } from "vitest";
import { emailTypoProblem, suggestEmailCorrection } from "@/lib/emailTypo";

describe("deteksi salah ketik domain email (cermin core)", () => {
  it("menyarankan domain penyedia yang dimaksud", () => {
    expect(suggestEmailCorrection("andi@gemail.com")).toBe("andi@gmail.com");
    expect(suggestEmailCorrection("andi@gmial.com")).toBe("andi@gmail.com");
    expect(suggestEmailCorrection("andi@gmail.co")).toBe("andi@gmail.com");
    expect(suggestEmailCorrection("andi@gmail.co.id")).toBe("andi@gmail.com");
    expect(suggestEmailCorrection("andi@hayoo.com")).toBe("andi@yahoo.com");
    expect(suggestEmailCorrection("andi@yahoo.co.di")).toBe("andi@yahoo.co.id");
  });

  it("tidak menyentuh domain yang sah", () => {
    for (const email of ["a@gmail.com", "a@yahoo.co.id", "a@email.com", "a@ymail.com", "a@hotmail.co.uk", "a@sman1kediri.sch.id"]) {
      expect(suggestEmailCorrection(email)).toBeNull();
    }
  });

  it("kalimat penolakan menyebut saran", () => {
    expect(emailTypoProblem("a@gmail.con", "Email pemesan")).toBe("Email pemesan sepertinya salah ketik. Maksud Anda a@gmail.com?");
  });
});
