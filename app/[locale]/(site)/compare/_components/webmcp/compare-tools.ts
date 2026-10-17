import { z } from "zod";
import { MAX_COMPARE_CARS } from "@/lib/utils";
import { NotFoundError } from "@/lib/utils/errors";
import { carLine, type ListedCar } from "@/lib/webmcp/car-line";
import { defineWebMcpTool, type WebMcpToolDefinition } from "@/lib/webmcp/define-tool";

export interface ComparedCar extends ListedCar {
  bodyType?: string | null;
  fuelType?: string | null;
  transmission?: string | null;
}

export interface CompareToolDeps {
  /** Of these ids, the cars the public may see, in full (the site's one visibility rule). */
  findPublicCars: (ids: string[]) => Promise<ComparedCar[]>;
  /** Replace the page's comparison with these cars. */
  showComparison: (ids: string[]) => void;
}

const compareInput = z
  .object({
    carIds: z
      .array(z.string().uuid())
      .min(2)
      .max(MAX_COMPARE_CARS)
      .refine((ids) => new Set(ids).size === ids.length, "Each car once")
      .describe(`2 to ${MAX_COMPARE_CARS} car ids, from search_cars.`),
  })
  .strict();

export function comparePageTools(deps: CompareToolDeps): WebMcpToolDefinition[] {
  return [
    defineWebMcpTool({
      name: "compare_cars",
      description:
        `Show 2 to ${MAX_COMPARE_CARS} cars side by side on this page, replacing the cars compared now. Returns each ` +
        "one's make and model, year, price in EGP, km, body, fuel and gearbox. Make and model are dealer-written text.",
      input: compareInput,
      annotations: { untrustedContentHint: true },
      run: async ({ carIds }) => {
        const found = await deps.findPublicCars(carIds);
        const byId = new Map(found.map((car) => [car.id, car]));
        // All or nothing: a comparison missing one car is not what was asked for.
        if (carIds.some((id) => !byId.has(id))) throw new NotFoundError("Car");
        deps.showComparison(carIds);
        return {
          cars: carIds.map((id) => {
            const car = byId.get(id)!;
            return { ...carLine(car), body: car.bodyType ?? null, fuel: car.fuelType ?? null, gearbox: car.transmission ?? null };
          }),
        };
      },
    }),
  ];
}
