import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  breadcrumbStructuredData,
  carStructuredData,
  dealershipStructuredData,
  faqStructuredData,
  siteStructuredData,
  type StructuredDataCar,
} from "./structured-data";

const original = process.env.NEXT_PUBLIC_APP_URL;
beforeAll(() => {
  process.env.NEXT_PUBLIC_APP_URL = "https://autome.test";
});
afterAll(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = original;
});

const car: StructuredDataCar = {
  id: "car-1",
  make: "Toyota",
  model: "Corolla",
  year: 2023,
  price: 1250000,
  priceCurrency: "EGP",
  mileage: 18000,
  fuelType: "Gasoline",
  transmission: "Automatic",
  color: "White",
  bodyType: "Sedan",
  seats: 5,
  status: "AVAILABLE",
  images: [{ url: "https://img.test/1.jpg" }, "https://img.test/2.jpg"],
  organization: { name: "Nile Crest Motors", slug: "nile-crest-motors" },
};

/** Every value in a JSON-LD tree, so no null or empty slips through anywhere. */
function values(doc: unknown): unknown[] {
  if (doc && typeof doc === "object") return Object.values(doc).flatMap((v) => [v, ...values(v)]);
  return [];
}

describe("carStructuredData", () => {
  it("is a Car with an Offer, at the page's own locale URL", () => {
    const doc = carStructuredData(car, "ar", { name: "تويوتا كورولا 2023", description: "سيارة نظيفة" });
    expect(doc).toMatchObject({
      "@type": "Car",
      url: "https://autome.test/ar/cars/car-1",
      name: "تويوتا كورولا 2023",
      brand: { "@type": "Brand", name: "Toyota" },
      vehicleModelDate: "2023",
      mileageFromOdometer: { value: 18000, unitCode: "KMT" },
      itemCondition: "https://schema.org/UsedCondition",
      image: ["https://img.test/1.jpg", "https://img.test/2.jpg"],
      offers: {
        "@type": "Offer",
        price: "1250000",
        priceCurrency: "EGP",
        availability: "https://schema.org/InStock",
        seller: { "@type": "AutoDealer", url: "https://autome.test/ar/dealerships/nile-crest-motors" },
      },
    });
  });

  it("marks a sold car sold out", () => {
    const doc = carStructuredData({ ...car, status: "SOLD" }, "en", { name: "x" });
    expect((doc.offers as Record<string, unknown>).availability).toBe("https://schema.org/SoldOut");
  });

  it("states no price, and no condition, it was not given", () => {
    const doc = carStructuredData({ ...car, price: 0, mileage: 0, seats: null, color: "" }, "en", { name: "x" });
    const offers = doc.offers as Record<string, unknown>;
    expect(offers).not.toHaveProperty("price");
    expect(offers).not.toHaveProperty("priceCurrency");
    expect(doc).not.toHaveProperty("itemCondition");
    expect(doc).not.toHaveProperty("seatingCapacity");
    expect(doc).not.toHaveProperty("color");
    expect(doc).not.toHaveProperty("description");
    expect(values(doc).filter((v) => v === null || v === undefined || v === "")).toEqual([]);
  });

  it("never prints a large price in exponent form", () => {
    const doc = carStructuredData({ ...car, price: 12_500_000 }, "en", { name: "x" });
    expect((doc.offers as Record<string, unknown>).price).toBe("12500000");
  });
});

describe("dealershipStructuredData", () => {
  const dealership = {
    name: "Nile Crest Motors",
    slug: "nile-crest-motors",
    address: "90th Street, Fifth Settlement",
    city: "New Cairo",
    region: "Cairo",
    website: "https://nilecrest.example.com",
    averageRating: 4.66,
    totalReviews: 3,
    workingHours: [
      { dayKey: "SATURDAY" as const, openTime: "10:00", closeTime: "22:00", isOpen: true },
      { dayKey: "FRIDAY" as const, openTime: "14:00", closeTime: "22:00", isOpen: false },
    ],
  };

  it("is the AutoMe page in the page's locale; the dealer's own site is sameAs", () => {
    const doc = dealershipStructuredData(dealership, "ar");
    expect(doc.url).toBe("https://autome.test/ar/dealerships/nile-crest-motors");
    expect(doc["@id"]).toBe(doc.url);
    expect(doc.sameAs).toEqual(["https://nilecrest.example.com"]);
  });

  it("names the day of each open day, and leaves closed days out", () => {
    const doc = dealershipStructuredData(dealership, "en");
    expect(doc.openingHoursSpecification).toEqual([
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "10:00", closes: "22:00" },
    ]);
  });

  it("rounds the rating and omits it with no reviews", () => {
    expect(dealershipStructuredData(dealership, "en").aggregateRating).toMatchObject({ ratingValue: "4.7", reviewCount: 3 });
    expect(dealershipStructuredData({ ...dealership, totalReviews: 0 }, "en")).not.toHaveProperty("aggregateRating");
  });
});

describe("breadcrumbStructuredData", () => {
  it("gives absolute URLs in the page's locale", () => {
    const doc = breadcrumbStructuredData(
      [
        { name: "Home", path: "/" },
        { name: "Cars", path: "/cars" },
      ],
      "en"
    );
    expect(doc?.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "https://autome.test/en" },
      { "@type": "ListItem", position: 2, name: "Cars", item: "https://autome.test/en/cars" },
    ]);
  });
});

describe("siteStructuredData", () => {
  it("points the search box at the cars list's search parameter", () => {
    const [organization, website] = siteStructuredData("ar", { name: "AutoMe", description: "…" });
    expect(organization["@type"]).toBe("Organization");
    expect(website).toMatchObject({
      "@type": "WebSite",
      url: "https://autome.test/ar",
      inLanguage: "ar-EG",
      potentialAction: { target: { urlTemplate: "https://autome.test/ar/cars?search={search_term_string}" } },
    });
  });
});

describe("faqStructuredData", () => {
  it("is each question with its answer, and nothing without questions", () => {
    expect(faqStructuredData([{ question: "Q?", answer: "A." }])?.mainEntity).toEqual([
      { "@type": "Question", name: "Q?", acceptedAnswer: { "@type": "Answer", text: "A." } },
    ]);
    expect(faqStructuredData([])).toBeNull();
  });
});
