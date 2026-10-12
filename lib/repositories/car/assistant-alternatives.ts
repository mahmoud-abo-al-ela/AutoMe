import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";
import { dealerSearchCondition } from "./search";
import { FROM } from "./search-words";

/** The fields an alternative is shown with; the id and photos are for its card, never the model. */
const ALTERNATIVE_FIELDS = {
  id: true,
  images: true,
  year: true,
  make: true,
  model: true,
  color: true,
  price: true,
  mileage: true,
  bodyType: true,
  transmission: true,
  fuelType: true,
} as const;

/**
 * The dealership's other cars on sale that a buyer's question names — "عندكم
 * كيا؟" finds its Kias however far they are in price from the car being
 * viewed. Words are judged and corrected exactly as the site's search judges
 * them (dealerSearchCondition), in this dealership's scope, which is in the
 * SQL; nearest to `price` first, since the buyer is looking at that budget.
 *
 * Empty when no word of the question names any of its cars ("is it
 * negotiable?") — the caller then offers the cars closest in price instead.
 */
export async function findOtherAvailableCarsMatching(input: {
  organizationId: string;
  excludeCarId: string;
  question: string;
  price: number;
  take: number;
}) {
  const { organizationId, excludeCarId, question, price, take } = input;
  const condition: Prisma.Sql | null = await dealerSearchCondition({ organizationId, status: "AVAILABLE", search: question });
  if (!condition) return [];

  const ids = await db.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT c."id" ${FROM}
    WHERE ${condition} AND c."id" <> ${excludeCarId}
    ORDER BY abs(c."price" - ${price}), c."createdAt" DESC, c."id"
    LIMIT ${take}`);
  if (ids.length === 0) return [];

  const rows = await db.car.findMany({
    // The scope again, beside the ids: the dealership never rests on a list alone.
    where: { id: { in: ids.map((row) => row.id) }, organizationId, status: "AVAILABLE" },
    select: ALTERNATIVE_FIELDS,
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.flatMap(({ id }) => byId.get(id) ?? []);
}
