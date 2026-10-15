import { describe, it, expect, vi, beforeEach } from "vitest";

const repo = vi.hoisted(() => ({
  findDealershipProfileText: vi.fn(),
  saveDealershipProfileLanguages: vi.fn(),
}));
vi.mock("@/lib/repositories/dealership", () => repo);

const ai = vi.hoisted(() => ({ translateDealershipProfile: vi.fn() }));
vi.mock("@/lib/services/ai/translateDealershipProfile", () => ai);

import { syncDealershipProfileText } from "./profile-translation";

const caller = { organizationId: "org-1", userId: null, priority: "low" as const };
const EN = "Quality used cars with a 12-month warranty.";
const AR = "سيارات مستعملة مضمونة مع ضمان لمدة ١٢ شهرًا.";
const ADDRESS_EN = "El Bahr Street, Tanta";
const ADDRESS_AR = "شارع البحر، طنطا";

beforeEach(() => vi.resetAllMocks());

describe("syncDealershipProfileText", () => {
  it("translates the financing note with the rest of the profile", async () => {
    repo.findDealershipProfileText.mockResolvedValue({ address: ADDRESS_EN, financingNote: "Instalments through partner banks" });
    ai.translateDealershipProfile.mockResolvedValue({ description: "", address: ADDRESS_AR, financingNote: "تقسيط عبر البنوك الشريكة" });

    await syncDealershipProfileText("org-1", caller);

    expect(ai.translateDealershipProfile).toHaveBeenCalledWith(
      { description: "", address: ADDRESS_EN, financingNote: "Instalments through partner banks" },
      "en",
      caller
    );
    expect(repo.saveDealershipProfileLanguages).toHaveBeenCalledWith(
      "org-1",
      { address: ADDRESS_EN, financingNote: "Instalments through partner banks" },
      {
        addressEn: ADDRESS_EN,
        addressAr: ADDRESS_AR,
        financingNoteEn: "Instalments through partner banks",
        financingNoteAr: "تقسيط عبر البنوك الشريكة",
      }
    );
  });

  it("translates fields written in one language in one call, and stores each pair", async () => {
    repo.findDealershipProfileText.mockResolvedValue({ description: `${EN} `, address: ADDRESS_EN });
    ai.translateDealershipProfile.mockResolvedValue({ description: AR, address: ADDRESS_AR });

    await syncDealershipProfileText("org-1", caller);

    expect(ai.translateDealershipProfile).toHaveBeenCalledTimes(1);
    expect(ai.translateDealershipProfile).toHaveBeenCalledWith({ description: EN, address: ADDRESS_EN, financingNote: "" }, "en", caller);
    // Guarded by the columns as stored, trailing space and all.
    expect(repo.saveDealershipProfileLanguages).toHaveBeenCalledWith(
      "org-1",
      { description: `${EN} `, address: ADDRESS_EN },
      { descriptionEn: EN, descriptionAr: AR, addressEn: ADDRESS_EN, addressAr: ADDRESS_AR }
    );
  });

  it("translates each direction separately when the dealer mixed languages", async () => {
    repo.findDealershipProfileText.mockResolvedValue({ description: AR, address: ADDRESS_EN });
    ai.translateDealershipProfile
      .mockResolvedValueOnce({ description: "", address: ADDRESS_AR }) // en → ar
      .mockResolvedValueOnce({ description: EN, address: "" }); // ar → en

    await syncDealershipProfileText("org-1", caller);

    expect(ai.translateDealershipProfile).toHaveBeenNthCalledWith(1, { description: "", address: ADDRESS_EN, financingNote: "" }, "en", caller);
    expect(ai.translateDealershipProfile).toHaveBeenNthCalledWith(2, { description: AR, address: "", financingNote: "" }, "ar", caller);
    expect(repo.saveDealershipProfileLanguages).toHaveBeenCalledWith("org-1", { address: ADDRESS_EN }, { addressEn: ADDRESS_EN, addressAr: ADDRESS_AR });
    expect(repo.saveDealershipProfileLanguages).toHaveBeenCalledWith("org-1", { description: AR }, { descriptionAr: AR, descriptionEn: EN });
  });

  it("spends nothing when every field is in step", async () => {
    repo.findDealershipProfileText.mockResolvedValue({
      description: EN,
      descriptionEn: EN,
      descriptionAr: AR,
      address: ADDRESS_EN,
      addressEn: ADDRESS_EN,
      addressAr: ADDRESS_AR,
    });

    await syncDealershipProfileText("org-1", caller);

    expect(ai.translateDealershipProfile).not.toHaveBeenCalled();
    expect(repo.saveDealershipProfileLanguages).not.toHaveBeenCalled();
  });

  it("never throws: a failed translation stores nothing", async () => {
    repo.findDealershipProfileText.mockResolvedValue({ description: EN });
    ai.translateDealershipProfile.mockRejectedValue(new Error("provider down"));

    await expect(syncDealershipProfileText("org-1", caller)).resolves.toBeUndefined();
    expect(repo.saveDealershipProfileLanguages).not.toHaveBeenCalled();
  });
});
