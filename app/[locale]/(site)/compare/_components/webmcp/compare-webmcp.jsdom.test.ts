import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

const { getCarsByIds } = vi.hoisted(() => ({ getCarsByIds: vi.fn() }));
vi.mock("@/actions/cars-listing", () => ({ getCarsByIds }));

import { compareUtils } from "@/lib/utils";
import { installModelContext } from "@/test/fixtures/webmcp";
import { useCompareWebMcpTools } from "./use-compare-webmcp-tools";

const car = (id: string, make: string) => ({
  id,
  make,
  model: "X",
  year: 2021,
  price: 900_000,
  mileage: 10_000,
  bodyType: "Sedan",
  fuelType: "Gasoline",
  transmission: "Automatic",
});
const A = car("11111111-1111-4111-8111-111111111111", "Toyota");
const B = car("22222222-2222-4222-8222-222222222222", "Kia");
const HIDDEN = "33333333-3333-4333-8333-333333333333";
const EARLIER = "44444444-4444-4444-8444-444444444444";

let root: Root | null = null;
function Page() {
  useCompareWebMcpTools();
  return null;
}

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

beforeEach(async () => {
  vi.clearAllMocks();
  localStorage.clear();
  compareUtils.addToCompare(EARLIER);
  // As the real action does: a list that finds no car at all is refused, not answered empty.
  getCarsByIds.mockImplementation(async (ids: string[]) => {
    const found = [A, B].filter((c) => ids.includes(c.id));
    return found.length ? { success: true, data: found } : { success: false, error: { message: "No cars found with the provided IDs", messageKey: "errors.compare.noCars", code: "VALIDATION_ERROR" } };
  });
  root = createRoot(document.createElement("div"));
});

afterEach(async () => {
  await act(async () => root?.unmount());
  delete (document as { modelContext?: unknown }).modelContext;
});

async function mount() {
  const context = installModelContext();
  await act(async () => root!.render(createElement(Page)));
  return context;
}

describe("compare_cars", () => {
  it("replaces the page's comparison and describes it", async () => {
    const context = await mount();
    const updated = vi.fn();
    window.addEventListener("compareListUpdated", updated);

    const reply = await context.call("compare_cars", { carIds: [A.id, B.id] });

    expect(compareUtils.getCompareList()).toEqual([A.id, B.id]);
    expect(updated).toHaveBeenCalledOnce();
    expect(reply).toEqual({
      cars: [
        { id: A.id, car: "Toyota X", year: 2021, priceEgp: 900_000, km: 10_000, body: "Sedan", fuel: "Gasoline", gearbox: "Automatic" },
        { id: B.id, car: "Kia X", year: 2021, priceEgp: 900_000, km: 10_000, body: "Sedan", fuel: "Gasoline", gearbox: "Automatic" },
      ],
    });
    window.removeEventListener("compareListUpdated", updated);
  });

  it("says not found when any car is hidden, and leaves the comparison as it was", async () => {
    const context = await mount();
    expect(await context.call("compare_cars", { carIds: [A.id, HIDDEN] })).toEqual({ error: "not_found" });
    // None of them public: the action refuses the list outright; still "not found".
    expect(await context.call("compare_cars", { carIds: [HIDDEN, EARLIER] })).toEqual({ error: "not_found" });
    expect(compareUtils.getCompareList()).toEqual([EARLIER]);
  });

  it("refuses one car, too many, or the same car twice, without asking the server", async () => {
    const context = await mount();
    for (const carIds of [[A.id], [A.id, B.id, HIDDEN, EARLIER], [A.id, A.id], ["not-a-uuid", B.id]]) {
      expect(await context.call("compare_cars", { carIds }), JSON.stringify(carIds)).toMatchObject({ error: "invalid_input" });
    }
    expect(getCarsByIds).not.toHaveBeenCalled();
    expect(compareUtils.getCompareList()).toEqual([EARLIER]);
  });
});
