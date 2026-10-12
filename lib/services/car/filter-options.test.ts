import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/repositories/car", () => ({}));
vi.mock("@/lib/repositories/user", () => ({}));
vi.mock("@/lib/services/car/search-meaning", () => ({ searchMeaning: vi.fn() }));

import { keepSelected } from "@/lib/services/car/listing";

describe("keepSelected", () => {
  const options = [
    { value: "Kia", count: 3 },
    { value: "Toyota", count: 5 },
  ];

  it("adds a chosen value no car has, at 0, in order", () => {
    expect(keepSelected(options, ["Honda"])).toEqual([
      { value: "Honda", count: 0 },
      { value: "Kia", count: 3 },
      { value: "Toyota", count: 5 },
    ]);
  });

  it("leaves the list alone when every chosen value is in it, whatever its case", () => {
    expect(keepSelected(options, ["Toyota"])).toBe(options);
    expect(keepSelected(options, "kia")).toBe(options);
  });

  it("leaves the list alone with nothing chosen", () => {
    expect(keepSelected(options, undefined)).toBe(options);
    expect(keepSelected(options, [])).toBe(options);
    expect(keepSelected(options, "")).toBe(options);
  });
});
