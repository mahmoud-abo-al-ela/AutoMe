import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import enCars from "@/messages/en/cars.json";
import arCars from "@/messages/ar/cars.json";
import enAttributes from "@/messages/en/carAttributes.json";
import arAttributes from "@/messages/ar/carAttributes.json";
import enDealerships from "@/messages/en/dealerships.json";
import arDealerships from "@/messages/ar/dealerships.json";

vi.mock("@/actions/cars-listing", () => ({
  getCars: vi.fn(async () => ({ success: true, data: { cars: [], pagination: { total: 0, page: 1, limit: 12, totalPages: 0 } } })),
  getCarsFilters: vi.fn(async () => ({ success: true, data: null })),
}));
vi.mock("@/actions/dealerships", () => ({
  getDealerships: vi.fn(async () => ({ success: true, data: { dealerships: [], pagination: { total: 0, page: 1, limit: 12, totalPages: 0 } } })),
  getDealershipFilters: vi.fn(async () => ({ success: true, data: null })),
}));

import { useCarsPage } from "./use-cars-page";
import { useDealershipsPage } from "./use-dealerships-page";

type Locale = "en" | "ar";
const MESSAGES = {
  en: { cars: enCars, carAttributes: enAttributes, dealerships: enDealerships },
  ar: { cars: arCars, carAttributes: arAttributes, dealerships: arDealerships },
};

let cars: ReturnType<typeof useCarsPage>;
let dealerships: ReturnType<typeof useDealershipsPage>;
let root: Root | null = null;

function Lists() {
  cars = useCarsPage(null, { filters: {}, page: 1, perPage: 12 });
  dealerships = useDealershipsPage(null, null);
  return null;
}

async function mount(locale: Locale, path: string) {
  window.history.replaceState(null, "", path);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  root = createRoot(document.createElement("div"));
  await act(async () =>
    root!.render(
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="Africa/Cairo">
        <QueryClientProvider client={client}>
          <Lists />
        </QueryClientProvider>
      </NextIntlClientProvider>
    )
  );
}

const address = () => window.location.pathname + window.location.search;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

beforeEach(() => vi.clearAllMocks());

afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
});

describe.each(["ar", "en"] as const)("in %s", (locale) => {
  it("filtering the cars keeps the language in the address", async () => {
    await mount(locale, `/${locale}/cars`);
    await act(async () => cars.handlers.toggleMulti("make", "Toyota"));
    expect(address()).toBe(`/${locale}/cars?make=Toyota`);
    await act(async () => cars.handlers.changePage(2));
    expect(address()).toBe(`/${locale}/cars?make=Toyota&page=2`);
    await act(async () => cars.handlers.resetAllFilters());
    expect(address()).toBe(`/${locale}/cars`);
  });

  it("back and forward still restore the cars filters", async () => {
    await mount(locale, `/${locale}/cars`);
    await act(async () => cars.handlers.toggleMulti("make", "Kia"));
    await act(async () => cars.handlers.toggleMulti("make", "Kia"));
    expect(cars.filters.make).toEqual([]);

    // What Back does: the previous entry's address, then popstate.
    await act(async () => {
      window.history.replaceState(null, "", `/${locale}/cars?make=Kia`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(cars.filters.make).toEqual(["Kia"]);
  });

  it("filtering the dealerships keeps the language in the address", async () => {
    await mount(locale, `/${locale}/dealerships`);
    await act(async () => dealerships.handlers.setFilter("city", "Cairo"));
    expect(address()).toBe(`/${locale}/dealerships?city=Cairo`);
  });
});
