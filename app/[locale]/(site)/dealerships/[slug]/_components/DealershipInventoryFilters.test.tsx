import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import dealerships from "@/messages/en/dealerships.json";
import carAttributes from "@/messages/en/carAttributes.json";
import { DealershipInventoryFilters } from "./DealershipInventoryFilters";
import type { DealershipCarFilterOptions, DealershipInventoryFilterState } from "../_lib/detail-types";

/**
 * The filter bar renders from what useInventoryFilters hands it: the search
 * text, the active-filter chips and the result count.
 */

const messages = { dealerships, carAttributes };

const available = {
  bodyTypes: ["Sedan", "SUV"],
  fuelTypes: ["Petrol"],
  transmissions: ["Automatic"],
  priceRange: { min: 0, max: 2_000_000 },
} as unknown as DealershipCarFilterOptions;

function render(filters: DealershipInventoryFilterState, totalCars?: number) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="Africa/Cairo">
      <DealershipInventoryFilters
        filters={filters}
        onFilterChange={() => undefined}
        availableFilters={available}
        totalCars={totalCars}
      />
    </NextIntlClientProvider>
  );
}

describe("DealershipInventoryFilters", () => {
  it("shows the search text, a chip per active filter, and the count", () => {
    const html = render({ search: "corolla", bodyType: "Sedan,SUV", sortBy: "newest" }, 12);
    expect(html).toContain('value="corolla"');
    expect(html).toContain("Search: “corolla”");
    expect(html).toContain(">Sedan<");
    expect(html).toContain(">SUV<");
    expect(html).toContain("12 cars");
  });

  it("labels a set price range as a chip", () => {
    const html = render({ minPrice: 300_000, sortBy: "newest" }, 3);
    expect(html).toContain("Price: ");
    expect(html).toContain("3 cars");
  });

  it("shows no chips with nothing set", () => {
    const html = render({ sortBy: "newest" }, 0);
    expect(html).toContain('value=""');
    expect(html).not.toContain("Search: ");
    expect(html).not.toContain("Price: ");
    expect(html).toContain("No cars");
  });
});
