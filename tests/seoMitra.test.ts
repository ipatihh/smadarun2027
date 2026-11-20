import { describe, expect, it } from "vitest";
import { jsonLdSitus, orgPengembang } from "@/lib/seo";

/**
 * PT KEMBAR INOVASI INDONESIA dinyatakan sebagai pengembang dan mitra ticketing
 * lewat node Organization yang `@id`-nya SAMA dengan yang dipasang kembar.in.
 * `@id` berbeda (dulu `#organisasi`) membuat Google menganggapnya entitas lain.
 */
describe("JSON-LD mitra ticketing", () => {
  it("memakai @id yang sama dengan node Organization di kembar.in", () => {
    expect(orgPengembang["@id"]).toBe("https://kembar.in/#organization");
    expect(orgPengembang.legalName).toBe("PT KEMBAR INOVASI INDONESIA");
  });

  it("situs menunjuk node itu sebagai creator dan provider", () => {
    const situs = jsonLdSitus["@graph"].find((n) => n["@type"] === "WebSite") as {
      creator: { "@id": string };
      provider: { "@id": string };
    };
    expect(situs.creator["@id"]).toBe(orgPengembang["@id"]);
    expect(situs.provider["@id"]).toBe(orgPengembang["@id"]);
  });
});
