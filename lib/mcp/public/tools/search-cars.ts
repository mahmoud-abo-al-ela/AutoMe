import { searchPublicCars } from "@/lib/services/public-catalog";
import { searchCarsInput, searchCarsOutput } from "../schemas";
import type { PublicTool } from "../tool";

/** Past this page a search is walking the catalogue, not looking for a car. */
const DEEP_PAGE = 5;

export const searchCarsTool: PublicTool<typeof searchCarsInput, typeof searchCarsOutput> = {
  name: "search_cars",
  title: "Search cars for sale on AutoMe",
  description:
    "Searches cars for sale on AutoMe, a car marketplace in Egypt, by words (English or Arabic, " +
    "spelling mistakes tolerated) and filters: make, body type, fuel, gearbox, colour, city, " +
    "dealership, price in Egyptian pounds (EGP), model year and mileage in km. Returns up to 20 cars " +
    "per page, each with its price, place, dealership and a link to its page. Use get_search_options " +
    "for the accepted filter values and get_car for one car's full details.",
  inputSchema: searchCarsInput,
  outputSchema: searchCarsOutput,
  costly: (input) => Boolean(input.query?.trim()) || input.page > DEEP_PAGE,
  run: async ({ locale, ...search }) => {
    const results = await searchPublicCars(search, locale, { source: "mcp", medium: "search_cars" });
    return { structured: results, count: results.cars.length };
  },
};
