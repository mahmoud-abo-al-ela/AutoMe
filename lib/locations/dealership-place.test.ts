import { describe, it, expect } from "vitest";
import { dealershipPlaceName, governorateName } from "@/lib/locations";
import { carSchema } from "@/lib/validations/schemas";

/**
 * The add-car form no longer asks where the car is: a car is where its
 * dealership is, from the dealership's structured governorate and city.
 */
describe("dealershipPlaceName", () => {
  it("reads 'city, governorate' in the reader's language", () => {
    const org = { city: "sharm-el-sheikh", region: "JS" };
    const en = dealershipPlaceName(org, "en");
    const ar = dealershipPlaceName(org, "ar");
    expect(en.startsWith("Sharm")).toBe(true);
    expect(ar.startsWith("شرم الشيخ")).toBe(true);
    // Each language uses its own comma.
    expect(ar).toContain("، ");
    expect(en).toContain(", ");
  });

  it("does not repeat a governorate the city already names", () => {
    // A dealer who put the governorate in the city field too.
    expect(dealershipPlaceName({ city: "CAI", region: "CAI" }, "ar")).toBe(governorateName("CAI", "ar"));
  });

  it("uses whichever part is set, and is empty for none", () => {
    expect(dealershipPlaceName({ region: "CAI" }, "en")).toBe("Cairo");
    expect(dealershipPlaceName({}, "en")).toBe("");
    expect(dealershipPlaceName(null, "ar")).toBe("");
  });
});

describe("adding a car without a location", () => {
  it("is valid — the form no longer asks for one", () => {
    const car = {
      title: "Toyota Corolla 2020",
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      price: 850000,
      mileage: 62000,
      bodyType: "Sedan",
      fuelType: "Gasoline",
      transmission: "Automatic",
      color: "Silver",
      seats: 5,
      description: "Single owner, full service history.",
      images: ["https://example.com/a.jpg"],
    };
    expect(carSchema.safeParse(car).success).toBe(true);
  });
});
