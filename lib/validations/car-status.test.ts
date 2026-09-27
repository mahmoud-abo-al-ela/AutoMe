import { describe, it, expect } from "vitest";
import { normalizeCarStatus } from "@/lib/constants/car-options";
import { carSchema, updateCarFullSchema, updateCarSchema } from "@/lib/validations/schemas";

/**
 * The dealer form sends "Available"; other callers send "AVAILABLE". Adding a
 * car used to accept only the second — so every car added from the form was
 * refused with "Invalid enum value ... received 'Available'".
 */

const validCar = {
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
  location: "New Cairo, Cairo",
  images: ["https://example.com/a.jpg"],
};

describe("normalizeCarStatus", () => {
  it.each([
    ["Available", "AVAILABLE"],
    ["Sold", "SOLD"],
    ["Unavailable", "UNAVAILABLE"],
    ["AVAILABLE", "AVAILABLE"],
    ["SOLD", "SOLD"],
  ])("reads %s as %s", (input, expected) => {
    expect(normalizeCarStatus(input)).toBe(expected);
  });

  it.each(["Pending", "", null, undefined, 3])("returns null for %s", (input) => {
    expect(normalizeCarStatus(input)).toBeNull();
  });
});

describe("car schemas accept either status spelling", () => {
  it("accepts the form's 'Available' when adding a car", () => {
    expect(carSchema.parse({ ...validCar, status: "Available" }).status).toBe("AVAILABLE");
  });

  it("keeps SOLD as SOLD rather than defaulting it to AVAILABLE", () => {
    expect(carSchema.parse({ ...validCar, status: "Sold" }).status).toBe("SOLD");
    expect(updateCarFullSchema.parse({ ...validCar, status: "SOLD" }).status).toBe("SOLD");
    expect(updateCarSchema.parse({ status: "Unavailable" }).status).toBe("UNAVAILABLE");
  });

  it("still rejects a status that is neither", () => {
    expect(carSchema.safeParse({ ...validCar, status: "Pending" }).success).toBe(false);
  });

  it("leaves status optional", () => {
    expect(carSchema.parse(validCar).status).toBeUndefined();
  });
});
