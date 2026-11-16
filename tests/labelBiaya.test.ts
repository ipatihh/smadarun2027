import { afterEach, describe, expect, it, vi } from "vitest";

import { getLiveEventData, NAMA_BIAYA_DEFAULT } from "@/lib/kembarinEvents";

function mockEvent(eventConfig: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          status: "active",
          ticket_types: [{ id: 1, category_name: "5KM", price: 150000, is_active: 1 }],
          event_config: eventConfig,
        },
      }),
    })
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("nama biaya layanan dari core", () => {
  it("memakai admin_fee_label bila biaya menyala", async () => {
    mockEvent({ enable_admin_fee: true, admin_fee_amount: 5000, admin_fee_label: "Biaya Layanan Gateway" });
    const live = await getLiveEventData();
    expect(live.adminFee).toBe(5000);
    expect(live.adminFeeLabel).toBe("Biaya Layanan Gateway");
  });

  it("jatuh ke nama bawaan bila label kosong, terlalu panjang, atau berisi karakter berbahaya", async () => {
    for (const label of ["", "   ", "x".repeat(61), "<b>Fee</b>", undefined, 42]) {
      mockEvent({ enable_admin_fee: true, admin_fee_amount: 5000, admin_fee_label: label });
      expect((await getLiveEventData()).adminFeeLabel).toBe(NAMA_BIAYA_DEFAULT);
    }
  });

  it("biaya mati: nominal 0 dan label bawaan", async () => {
    mockEvent({ enable_admin_fee: false, admin_fee_amount: 5000, admin_fee_label: "Apa saja" });
    const live = await getLiveEventData();
    expect(live.adminFee).toBe(0);
    expect(live.adminFeeLabel).toBe(NAMA_BIAYA_DEFAULT);
  });
});
