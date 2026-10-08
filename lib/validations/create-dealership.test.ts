import { describe, expect, it } from "vitest";
import { createDealershipSchema } from "./schemas";
import { EGYPT_GOVERNORATES } from "@/lib/locations/data";

const cairo = EGYPT_GOVERNORATES.find((g) => g.cities.length > 0 && g.en === "Cairo") ?? EGYPT_GOVERNORATES.find((g) => g.cities.length > 0)!;
const elsewhere = EGYPT_GOVERNORATES.find((g) => g.code !== cairo.code && g.cities.length > 0)!;

const valid = {
  name: "Nile Motors",
  slug: "nile-motors",
  description: "",
  region: cairo.code,
  city: cairo.cities[0].slug,
  address: "",
  phone: "",
  email: "",
  website: "",
  planId: "plan-1",
  ownerEmail: "Karim@NileMotors.eg ",
};

describe("adding a dealership", () => {
  it("takes a dealership with a place and an owner, empty optional fields as null", () => {
    const parsed = createDealershipSchema.parse(valid);
    expect(parsed.ownerEmail).toBe("karim@nilemotors.eg");
    expect(parsed.email).toBeNull();
    expect(parsed.address).toBeNull();
  });

  it("needs the area to be in the governorate", () => {
    const result = createDealershipSchema.safeParse({ ...valid, region: elsewhere.code });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["city"]);
  });

  it("needs an owner and a well-formed web address", () => {
    expect(createDealershipSchema.safeParse({ ...valid, ownerEmail: "" }).success).toBe(false);
    expect(createDealershipSchema.safeParse({ ...valid, slug: "Nile Motors" }).success).toBe(false);
    expect(createDealershipSchema.safeParse({ ...valid, region: "cairo; drop" }).success).toBe(false);
  });
});
