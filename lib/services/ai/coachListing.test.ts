import { describe, it, expect, vi, beforeEach } from "vitest";

const generateStructured = vi.hoisted(() => vi.fn());
vi.mock("@/lib/ai/client", () => ({ generateStructured }));

import { coachListing } from "@/lib/services/ai/coachListing";
import { AI_FEATURES } from "@/lib/ai/features";

const listing = {
  year: 2020,
  make: "Toyota",
  model: "Corolla",
  mileage: 62000,
  bodyType: "Sedan",
  description: "Clean car.",
  features: [],
  imageCount: 1,
};
const ctx = { organizationId: "org-1", userId: "u1" };

beforeEach(() => vi.clearAllMocks());

describe("coachListing", () => {
  it("keeps advice only for the issues the rules flagged", async () => {
    generateStructured.mockResolvedValue({
      advice: [
        { code: "fewPhotos", text: " Add the interior and the boot. " },
        // The rules did not flag this; the model does not get to add problems.
        { code: "zeroMileage", text: "Check the odometer." },
      ],
    });
    const advice = await coachListing(listing, ["fewPhotos", "noFeatures"], "en", ctx);
    expect(advice).toEqual({ fewPhotos: "Add the interior and the boot." });
  });

  it("makes no call when nothing was flagged", async () => {
    expect(await coachListing(listing, [], "ar", ctx)).toEqual({});
    expect(generateStructured).not.toHaveBeenCalled();
  });

  it("is billed under its own feature, and caches per language", async () => {
    generateStructured.mockResolvedValue({ advice: [] });
    await coachListing(listing, ["fewPhotos"], "en", ctx);
    await coachListing(listing, ["fewPhotos"], "ar", ctx);
    const [en, ar] = generateStructured.mock.calls.map((c) => c[0]);
    expect(en.feature).toBe(AI_FEATURES.listingQualityCoach);
    expect(en.promptVersion).not.toBe(ar.promptVersion);
  });
});
