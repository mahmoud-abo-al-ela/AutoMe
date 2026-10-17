import { z } from "zod";
import { DEFAULT_FILTERS, type CarPageFilters } from "@/hooks/cars-page-filters";
import { SORT_OPTIONS } from "@/lib/constants/car-options";
import { SPECS, type SpecKind } from "@/lib/search/specs";
import { NotFoundError } from "@/lib/utils/errors";
import { carLine, type ListedCar } from "@/lib/webmcp/car-line";
import { defineWebMcpTool, type WebMcpToolDefinition } from "@/lib/webmcp/define-tool";

export interface CarsToolDeps {
  /** Apply a whole set of filters as the panel does: state, URL, chips (useCarsPage). */
  applyFilters: (filters: CarPageFilters) => void;
  /** The first page for these filters — the query the page renders. */
  loadFirstPage: (filters: CarPageFilters) => Promise<{ cars: ListedCar[]; total: number }>;
  /** Of these ids, the cars the public may see (the site's one visibility rule). */
  findPublicCars: (ids: string[]) => Promise<{ id: string }[]>;
  /** Go to a car's page, in the reader's language. */
  navigateToCar: (id: string) => void;
}

const specValues = (kind: SpecKind) =>
  SPECS.filter((spec) => spec.kind === kind).map((spec) => spec.value) as [string, ...string[]];

const SORTS = Object.values(SORT_OPTIONS) as [string, ...string[]];
const price = z.number().int().min(0).max(100_000_000);
const year = z.number().int().min(1950).max(2100);

export const searchCarsInput = z
  .object({
    query: z.string().trim().min(1).max(200).optional().describe("Words, English or Arabic, e.g. 'white corolla automatic'."),
    makes: z.array(z.string().trim().min(1).max(40)).max(10).optional().describe("Makes, e.g. ['Toyota', 'Kia']."),
    bodyTypes: z.array(z.enum(specValues("bodyType"))).max(10).optional(),
    fuelTypes: z.array(z.enum(specValues("fuelType"))).max(10).optional(),
    transmissions: z.array(z.enum(specValues("transmission"))).max(10).optional(),
    color: z.enum(specValues("color")).optional(),
    city: z.string().trim().min(1).max(60).optional().describe("A city in Egypt, e.g. Cairo."),
    minPriceEgp: price.optional(),
    maxPriceEgp: price.optional(),
    minYear: year.optional(),
    maxYear: year.optional(),
    maxKm: z.number().int().min(0).max(2_000_000).optional(),
    sort: z.enum(SORTS).optional().describe("newest (by relevance when there are words), priceAsc, priceDesc, yearDesc, yearAsc, mileageAsc."),
  })
  .strict();

/** An agent's search is a new search: it replaces the filters, it does not add to them. */
export function filtersFor(input: z.output<typeof searchCarsInput>): CarPageFilters {
  return {
    ...DEFAULT_FILTERS,
    search: input.query,
    make: input.makes ?? [],
    bodyType: input.bodyTypes ?? [],
    fuelType: input.fuelTypes ?? [],
    transmission: input.transmissions ?? [],
    color: input.color,
    city: input.city,
    minPrice: input.minPriceEgp,
    maxPrice: input.maxPriceEgp,
    minYear: input.minYear,
    maxYear: input.maxYear,
    maxMileage: input.maxKm,
    sortBy: input.sort ?? DEFAULT_FILTERS.sortBy,
  };
}

const openCarInput = z.object({ carId: z.string().uuid().describe("A car's id, from search_cars.") }).strict();

export function carsPageTools(deps: CarsToolDeps): WebMcpToolDefinition[] {
  const searchCars = defineWebMcpTool({
    name: "search_cars",
    description:
      "Search the cars for sale on this page, as the filter panel does: the page shows the results and the " +
      "filters. Returns the first page of cars (id, make and model, year, price in EGP, km) and the total. " +
      "Replaces any filters already set. Make and model are dealer-written text.",
    input: searchCarsInput,
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    run: async (input) => {
      const filters = filtersFor(input);
      deps.applyFilters(filters);
      const { cars, total } = await deps.loadFirstPage(filters);
      return { total, shown: cars.length, cars: cars.map(carLine) };
    },
  });

  const openCar = defineWebMcpTool({
    name: "open_car",
    description: "Open one car's page, with its photos, details, price and the dealership's contact.",
    input: openCarInput,
    annotations: { readOnlyHint: true },
    run: async ({ carId }) => {
      const [car] = await deps.findPublicCars([carId]);
      if (!car) throw new NotFoundError("Car");
      deps.navigateToCar(car.id);
      return { opened: car.id };
    },
  });

  return [searchCars, openCar];
}
