import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import cars from "@/messages/en/cars.json";
import carAttributes from "@/messages/en/carAttributes.json";

const actions = vi.hoisted(() => ({ getCars: vi.fn(), getCarsFilters: vi.fn(), getCarsByIds: vi.fn() }));
vi.mock("@/actions/cars-listing", () => actions);
const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => router }));

import { useCarsPage } from "@/hooks/use-cars-page";
import { installModelContext } from "@/test/fixtures/webmcp";
import { useCarsWebMcpTools } from "./use-cars-webmcp-tools";

const TOYOTA = { id: "11111111-1111-4111-8111-111111111111", make: "Toyota", model: "Corolla", year: 2020, price: 850_000, mileage: 40_000 };
const KIA = { id: "22222222-2222-4222-8222-222222222222", make: "Kia", model: "Cerato", year: 2019, price: 700_000, mileage: 60_000 };
const HIDDEN = "33333333-3333-4333-8333-333333333333";

type Page = ReturnType<typeof useCarsPage>;
let page: Page;
let root: Root | null = null;

function Harness({ withTools }: { withTools: boolean }) {
  page = useCarsPage(null, { filters: {}, page: 1, perPage: 12 });
  if (withTools) useCarsWebMcpTools(page); // eslint-disable-line react-hooks/rules-of-hooks -- fixed per mount
  return null;
}

async function mount(withTools: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  root = createRoot(document.createElement("div"));
  await act(async () =>
    root!.render(
      <NextIntlClientProvider locale="en" messages={{ cars, carAttributes }} timeZone="Africa/Cairo">
        <QueryClientProvider client={client}>
          <Harness withTools={withTools} />
        </QueryClientProvider>
      </NextIntlClientProvider>
    )
  );
}

/** Let fetches settle and React render them. */
const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

async function agent(context: ReturnType<typeof installModelContext>, name: string, args: unknown) {
  let pending!: Promise<unknown>;
  await act(async () => {
    pending = context.call(name, args);
  });
  for (let i = 0; i < 5; i++) await settle();
  return pending;
}

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/en/cars");
  actions.getCarsFilters.mockResolvedValue({ success: true, data: null });
  actions.getCars.mockImplementation(async (input: { make?: string[] }) => {
    const found = input.make?.length ? [TOYOTA, KIA].filter((car) => input.make!.includes(car.make)) : [TOYOTA, KIA];
    return {
      success: true,
      data: { cars: found, pagination: { total: found.length, page: 1, limit: 12, totalPages: 1 }, relaxedSearch: null, search: null },
    };
  });
  // As the real action does: a list that finds no car at all is refused, not answered empty.
  actions.getCarsByIds.mockImplementation(async (ids: string[]) => {
    const found = [TOYOTA, KIA].filter((car) => ids.includes(car.id));
    return found.length ? { success: true, data: found } : { success: false, error: { message: "No cars found with the provided IDs", messageKey: "errors.compare.noCars", code: "VALIDATION_ERROR" } };
  });
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  delete (document as { modelContext?: unknown }).modelContext;
});

describe("search_cars", () => {
  it("leaves the URL and chips the filter panel would, and returns the cards shown", async () => {
    // The person, in the panel: Toyota, then a price ceiling.
    await mount(false);
    await act(async () => page.handlers.toggleMulti("make", "Toyota"));
    await act(async () => page.handlers.commitRange("minPrice", "maxPrice", [0, 900_000], { min: 0, max: 5_000_000 }));
    await settle();
    const byPanel = { url: window.location.pathname + window.location.search, chips: page.activeFilters };
    await act(async () => root?.unmount());

    // An agent, through the tool.
    window.history.replaceState(null, "", "/en/cars");
    const context = installModelContext();
    await mount(true);
    const reply = await agent(context, "search_cars", { makes: ["Toyota"], maxPriceEgp: 900_000 });

    expect(window.location.pathname + window.location.search).toBe(byPanel.url);
    expect(page.activeFilters).toEqual(byPanel.chips);
    expect(reply).toEqual({
      total: 1,
      shown: 1,
      cars: [{ id: TOYOTA.id, car: "Toyota Corolla", year: 2020, priceEgp: 850_000, km: 40_000 }],
    });
    expect((reply as { cars: { id: string }[] }).cars.map((car) => car.id)).toEqual(page.cars.map((car) => car.id));
  });

  it("is one request with the page's own list, not a second", async () => {
    const context = installModelContext();
    await mount(true);
    await settle();
    actions.getCars.mockClear();
    await agent(context, "search_cars", { makes: ["Kia"] });
    expect(actions.getCars).toHaveBeenCalledTimes(1);
    expect(page.cars.map((car) => car.id)).toEqual([KIA.id]);
  });

  it("refuses values the panel does not offer, before changing anything", async () => {
    const context = installModelContext();
    await mount(true);
    const before = window.location.search;
    for (const args of [{ bodyTypes: ["Spaceship"] }, { maxPriceEgp: -5 }, { sort: "random" }, { query: "" }, { surprise: true }]) {
      expect(await agent(context, "search_cars", args), JSON.stringify(args)).toMatchObject({ error: "invalid_input" });
    }
    expect(window.location.search).toBe(before);
  });
});

describe("open_car", () => {
  it("opens a car the public may see, in the reader's language", async () => {
    const context = installModelContext();
    await mount(true);
    expect(await agent(context, "open_car", { carId: TOYOTA.id })).toEqual({ opened: TOYOTA.id });
    expect(router.push).toHaveBeenCalledWith(`/cars/${TOYOTA.id}`);
  });

  it("says not found for a hidden car, and goes nowhere", async () => {
    const context = installModelContext();
    await mount(true);
    expect(await agent(context, "open_car", { carId: HIDDEN })).toEqual({ error: "not_found" });
    expect(router.push).not.toHaveBeenCalled();
  });
});
