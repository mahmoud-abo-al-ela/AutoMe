import { describe, it, expect } from "vitest";
import { WEBMCP_BUDGETS, toDescriptor } from "@/lib/webmcp/define-tool";
import { carPageTools } from "../_components/CarWebMcpTools";
import type { CarDetail } from "./car-detail-types";
import { carToolSummary } from "./webmcp-summary";

const car = {
  id: "11111111-1111-4111-8111-111111111111",
  make: "Toyota",
  model: "Corolla",
  year: 2020,
  price: 850_000,
  mileage: 40_000,
  status: "AVAILABLE",
  bodyType: "Sedan",
  fuelType: "Gasoline",
  transmission: "Automatic",
  color: "White",
  title: null,
  titleEn: null,
  titleAr: "تويوتا كورولا ٢٠٢٠ نظيفة",
  description: "A".repeat(2_000),
  descriptionAr: null,
  features: Array.from({ length: 30 }, (_, i) => `Feature ${i}`),
  featuresAr: [],
  organization: { name: "Cairo Auto Gallery", slug: "cairo-auto", city: "nasr-city", region: "CAI", phone: "+20 100 000 0000", email: "never@example.com" },
} as unknown as CarDetail;

describe("carToolSummary", () => {
  it("is the page's own view of the car, cut to fit", () => {
    const summary = carToolSummary(car, "en");
    expect(summary).toMatchObject({ id: car.id, year: 2020, priceEgp: 850_000, km: 40_000, status: "AVAILABLE", color: "White" });
    expect(summary.features).toHaveLength(15);
    expect(summary.description).toHaveLength(501);
    expect(summary.dealership).toEqual({ name: "Cairo Auto Gallery", slug: "cairo-auto", place: "Nasr City, Cairo", phone: "+20 100 000 0000" });
    expect(carToolSummary(car, "ar").dealership?.place).toBe("مدينة نصر، القاهرة");
  });

  it("titles the car in the reader's language, falling back like the page", () => {
    expect(carToolSummary(car, "ar").title).toBe("تويوتا كورولا ٢٠٢٠ نظيفة");
    // No English title: the Arabic one, as the page shows it, rather than none.
    expect(carToolSummary(car, "en").title).toBe("تويوتا كورولا ٢٠٢٠ نظيفة");
    expect(carToolSummary({ ...car, titleAr: null } as CarDetail, "en").title).toBe("2020 Toyota Corolla");
  });

  it("never carries the dealership's email", () => {
    expect(JSON.stringify(carToolSummary(car, "en"))).not.toContain("never@example.com");
  });

  it("fits Chrome's output budget even for a long listing", async () => {
    const [tool] = carPageTools(carToolSummary(car, "en"));
    const reply = await toDescriptor(tool).execute({});
    expect(reply.length).toBeLessThanOrEqual(WEBMCP_BUDGETS.output);
    expect(tool.annotations).toEqual({ readOnlyHint: true, untrustedContentHint: true });
  });
});
