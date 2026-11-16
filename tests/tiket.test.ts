import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Tiket from "@/components/Tiket/Tiket";
import { getLiveEventData, type LiveEventData } from "@/lib/kembarinEvents";

vi.mock("@/lib/kembarinEvents", () => ({ getLiveEventData: vi.fn() }));

const kategoriReguler = { categoryKey: "5 KM  Reguler", price: 150000, id: 1 };
const kategoriBaru = { categoryKey: "5 KM Pelajar", price: 100000, id: 2 };

async function renderTiket(ticketTypes: LiveEventData["ticketTypes"]) {
  vi.mocked(getLiveEventData).mockResolvedValue({
    ticketTypes,
    isOpen: true,
    comingSoon: false,
    adminFee: 0,
    multiTicketEnabled: false,
    maxTicketsPerOrder: 1,
  } as LiveEventData);
  return renderToStaticMarkup(await Tiket());
}

describe("fasilitas tiket", () => {
  it.each([
    ["satu kategori", [kategoriReguler]],
    ["dua kategori termasuk kategori baru", [kategoriReguler, kategoriBaru]],
  ])("tetap menampilkan fasilitas bersama untuk %s", async (_label, ticketTypes) => {
    const html = await renderTiket(ticketTypes);

    expect(html).toContain("Semua kategori sudah termasuk");
    expect(html.match(/Jersey Eksklusif SMADARUN 2027/g)).toHaveLength(1);
    expect(html.match(/Medali Finisher/g)).toHaveLength(1);
  });
});
