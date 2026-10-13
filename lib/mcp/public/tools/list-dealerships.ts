import { listPublicDealerships } from "@/lib/services/public-catalog";
import { listDealershipsInput, listDealershipsOutput } from "../schemas";
import type { PublicTool } from "../tool";

/** Past this page a search is walking the list, not looking for a dealership. */
const DEEP_PAGE = 5;

export const listDealershipsTool: PublicTool<typeof listDealershipsInput, typeof listDealershipsOutput> = {
  name: "list_dealerships",
  title: "Dealerships on AutoMe",
  description:
    "Lists car dealerships on AutoMe, a marketplace in Egypt, optionally by words or city: each one's " +
    "name, place, AutoMe buyers' rating, how many cars it has for sale, and its page. Pass a " +
    "dealership's slug to search_cars to see its cars.",
  inputSchema: listDealershipsInput,
  outputSchema: listDealershipsOutput,
  costly: (input) => Boolean(input.query?.trim()) || input.page > DEEP_PAGE,
  run: async ({ locale, ...search }) => {
    const results = await listPublicDealerships(search, locale, { source: "mcp", medium: "list_dealerships" });
    return { structured: results, count: results.dealerships.length };
  },
};
