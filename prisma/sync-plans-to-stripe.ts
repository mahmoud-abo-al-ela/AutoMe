/**
 * Create (or refresh) the Stripe product + prices for every paid Plan row and
 * write the resulting IDs back to the database.
 *
 * `pnpm db:sync-plans` referenced this file but it was never committed, so
 * paid checkout failed at "Plan X is not configured for Stripe billing" on any
 * fresh Stripe account.
 *
 * Idempotent: a plan that already has a stripeProductId is updated in place
 * (Stripe cannot change a price amount, so updateStripePrice archives the old
 * price and creates a new one only when the amount actually changed).
 *
 * Run: pnpm db:sync-plans
 */
import "dotenv/config";
import { db } from "../lib/prisma";
import {
  createPlanStripeResources,
  updatePlanStripeResources,
} from "../lib/services/stripe/plan";

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set — nothing to sync against.");
  }
  console.log(
    `Syncing plans to Stripe (${key.startsWith("sk_live") ? "LIVE ⚠️" : "test"} mode)\n`
  );

  const plans = await db.plan.findMany({ orderBy: { monthlyPrice: "asc" } });

  for (const plan of plans) {
    // Free plans never touch Stripe — checkout short-circuits before billing.
    if (plan.monthlyPrice === 0 && plan.yearlyPrice === 0) {
      console.log(`- ${plan.type}: free plan, skipped`);
      continue;
    }

    const input = {
      id: plan.id,
      name: plan.name,
      type: plan.type,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
    };

    const resources = plan.stripeProductId
      ? await updatePlanStripeResources(input, {
          stripeProductId: plan.stripeProductId,
          stripeMonthlyPriceId: plan.stripeMonthlyPriceId,
          stripeYearlyPriceId: plan.stripeYearlyPriceId,
        })
      : await createPlanStripeResources(input);

    await db.plan.update({
      where: { id: plan.id },
      data: {
        stripeProductId: resources.stripeProductId,
        stripeMonthlyPriceId: resources.stripeMonthlyPriceId,
        stripeYearlyPriceId: resources.stripeYearlyPriceId,
      },
    });

    console.log(
      `- ${plan.type}: ${plan.stripeProductId ? "updated" : "created"} ` +
        `product=${resources.stripeProductId} ` +
        `monthly=${resources.stripeMonthlyPriceId ?? "—"} ` +
        `yearly=${resources.stripeYearlyPriceId ?? "—"}`
    );
  }

  console.log("\nDone.");
}

main()
  .catch((error) => {
    console.error("Sync failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
