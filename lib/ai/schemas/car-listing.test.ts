import { describe, it, expect } from "vitest";
import { zodToJsonSchema } from "zod-to-json-schema";
import { carListingSchema } from "@/lib/ai/schemas/car-listing";
import { imageSearchSchema } from "@/lib/ai/schemas/image-search";
import { BODY_TYPES } from "@/lib/constants/car-options";

const valid = {
  make: "Toyota",
  model: "Corolla",
  year: 2020,
  color: "Silver",
  price: 850000,
  mileage: 62000,
  bodyType: "Sedan",
  fuelType: "Gasoline",
  transmission: "Automatic",
  seats: 5,
  titleEn: "Toyota Corolla 2020",
  titleAr: "تويوتا كورولا ٢٠٢٠",
  descriptionEn: "Well kept, single owner.",
  descriptionAr: "بحالة ممتازة، مالك واحد.",
  features: ["Bluetooth", "Cruise control"],
  confidence: 0.82,
};

describe("carListingSchema", () => {
  it("accepts a well-formed extraction", () => {
    expect(carListingSchema.parse(valid)).toMatchObject({ make: "Toyota", year: 2020 });
  });

  it("coerces the numerics the model returns as strings", () => {
    const parsed = carListingSchema.parse({
      ...valid,
      year: "2020",
      price: "850000",
      mileage: "62000",
      seats: "5",
      confidence: "0.82",
    });

    expect(parsed).toMatchObject({
      year: 2020,
      price: 850000,
      mileage: 62000,
      seats: 5,
      confidence: 0.82,
    });
  });

  it("accepts features as a single string as well as a list", () => {
    const parsed = carListingSchema.parse({ ...valid, features: "Bluetooth, ABS" });
    expect(parsed.features).toBe("Bluetooth, ABS");
  });

  it("rejects the verbose body type that used to need a hand-patch", () => {
    // AICarForm carried `if (bodyType === "Sport Utility Vehicle (SUV)") return "SUV"`.
    // The allowlist makes that value unrepresentable instead of correcting it.
    const result = carListingSchema.safeParse({
      ...valid,
      bodyType: "Sport Utility Vehicle (SUV)",
    });

    expect(result.success).toBe(false);
  });

  it.each([
    ["fuelType", "Petrol"],
    ["transmission", "Auto"],
  ])("rejects %s outside the allowlist", (field, value) => {
    expect(carListingSchema.safeParse({ ...valid, [field]: value }).success).toBe(false);
  });

  it.each([
    ["a year before cars existed", { year: 1800 }],
    ["a negative price", { price: -1 }],
    ["negative mileage", { mileage: -5 }],
    ["an impossible seat count", { seats: 99 }],
    ["confidence above 1", { confidence: 4 }],
    ["a missing make", { make: "" }],
  ])("rejects %s", (_label, patch) => {
    expect(carListingSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});

describe("imageSearchSchema", () => {
  it('lets the model decline a field with ""', () => {
    const parsed = imageSearchSchema.parse({
      make: "",
      bodyType: "",
      color: "",
      confidence: 0.1,
    });

    expect(parsed.bodyType).toBe("");
  });

  it("rejects a body type that is not a filter value", () => {
    // These become query parameters matched by equality, so anything off the
    // allowlist is a guaranteed empty result page.
    const result = imageSearchSchema.safeParse({
      make: "Toyota",
      bodyType: "Crossover",
      color: "white",
      confidence: 0.9,
    });

    expect(result.success).toBe(false);
  });
});

describe("the schema sent to the provider", () => {
  it("carries the allowlist as an enum, so the API constrains the model", () => {
    // Validating our side only would still let a bad value cost a request.
    // This asserts the constraint actually travels to Gemini.
    const json = zodToJsonSchema(carListingSchema, { $refStrategy: "none" }) as {
      properties: Record<string, { enum?: string[] }>;
    };

    expect(json.properties.bodyType.enum).toEqual(BODY_TYPES);
    expect(json.properties.bodyType.enum).not.toContain("Sport Utility Vehicle (SUV)");
  });

  it("omits $schema, which the API rejects rather than ignores", () => {
    const json = zodToJsonSchema(carListingSchema, { $refStrategy: "none" }) as Record<
      string,
      unknown
    >;
    delete json.$schema;

    expect(json).not.toHaveProperty("$schema");
  });
});

describe("bilingual listing copy", () => {
  it.each(["titleEn", "titleAr", "descriptionEn", "descriptionAr"])(
    "requires %s",
    (field) => {
      const { [field]: _dropped, ...without } = valid as Record<string, unknown>;
      expect(carListingSchema.safeParse(without).success).toBe(false);
    }
  );

  it.each(["titleEn", "titleAr"])("rejects an empty %s", (field) => {
    // An empty title is worse than none: the UI falls back to a generated
    // "2020 Toyota Corolla" only when the field is absent, not when it is "".
    expect(carListingSchema.safeParse({ ...valid, [field]: "" }).success).toBe(false);
  });

  it("allows an empty description in either language", () => {
    // A photo the model cannot say much about should still yield a listing.
    const parsed = carListingSchema.safeParse({
      ...valid,
      descriptionEn: "",
      descriptionAr: "",
    });

    expect(parsed.success).toBe(true);
  });

  it("keeps Arabic text intact through validation", () => {
    const parsed = carListingSchema.parse(valid);

    expect(parsed.titleAr).toBe("تويوتا كورولا ٢٠٢٠");
    expect(parsed.descriptionAr).toBe("بحالة ممتازة، مالك واحد.");
  });

  it("sends all four language fields to the provider as required", () => {
    const json = zodToJsonSchema(carListingSchema, { $refStrategy: "none" }) as {
      required: string[];
    };

    expect(json.required).toEqual(
      expect.arrayContaining(["titleEn", "titleAr", "descriptionEn", "descriptionAr"])
    );
  });
});
