import Stripe from "stripe";
import { logError } from "@/lib/utils/errors";

/**
 * The currency Stripe charges subscriptions in.
 *
 * AutoMe is Egypt-only, so this is EGP; it must stay in step with
 * `formatPlanPrice` in lib/utils/currency.ts, or the product displays one
 * currency while Stripe bills another.
 *
 * Stripe Price objects are immutable in currency: changing this does not
 * convert existing prices, it only affects prices created from here on.
 * `updateStripePrice` below archives a price whose currency no longer matches
 * and creates a replacement, which is what `pnpm db:sync-plans` relies on.
 */
export const PLAN_CURRENCY = "egp";

/** The plan fields these helpers read when creating/updating Stripe resources. */
export interface StripePlanInput {
    /**
     * Absent when creating a plan — the row does not exist yet, so the Stripe
     * product's metadata.planId is simply omitted, as it always has been.
     */
    id?: string;
    name: string;
    type: string;
    monthlyPrice: number;
    yearlyPrice: number;
}

/** The Stripe resource IDs a plan carries, as stored on the Plan row. */
export interface PlanStripeResources {
    stripeProductId: string;
    stripeMonthlyPriceId: string | null;
    stripeYearlyPriceId: string | null;
}

/** Narrow an unknown catch binding to a message for error interpolation. */
function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

// Initialize Stripe with validation
function getStripeClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY || "dummy_key";
    if (secretKey === "dummy_key" && process.env.NODE_ENV === "production") {
        console.warn("STRIPE_SECRET_KEY is not configured");
    }
    return new Stripe(secretKey);
}

const stripe = getStripeClient();

/**
 * Create a Stripe product for a plan
 */
export async function createStripeProduct(plan: StripePlanInput): Promise<string> {
    try {
        const product = await stripe.products.create({
            name: plan.name,
            description: `${plan.type} plan - ${plan.name}`,
            metadata: {
                planId: plan.id ?? null,
                planType: plan.type,
            },
        });

        return product.id;
    } catch (error) {
        logError("Error creating Stripe product:", error);
        throw new Error(`Failed to create Stripe product: ${errorMessage(error)}`);
    }
}

/**
 * Create a Stripe price for a product
 */
export async function createStripePrice(
    productId: string,
    amount: number,
    interval: Stripe.PriceCreateParams.Recurring.Interval = "month"
): Promise<string> {
    try {
        const price = await stripe.prices.create({
            product: productId,
            unit_amount: amount,
            currency: PLAN_CURRENCY,
            recurring: {
                interval: interval,
            },
        });

        return price.id;
    } catch (error) {
        logError("Error creating Stripe price:", error);
        throw new Error(`Failed to create Stripe price: ${errorMessage(error)}`);
    }
}

/**
 * Update a Stripe product
 */
export async function updateStripeProduct(
    productId: string,
    data: StripePlanInput
): Promise<Stripe.Product> {
    try {
        const product = await stripe.products.update(productId, {
            name: data.name,
            description: `${data.type} plan - ${data.name}`,
            metadata: {
                planId: data.id ?? null,
                planType: data.type,
            },
        });

        return product;
    } catch (error) {
        logError("Error updating Stripe product:", error);
        throw new Error(`Failed to update Stripe product: ${errorMessage(error)}`);
    }
}

/**
 * Update or create a Stripe price
 * If the amount changes, we need to create a new price (Stripe doesn't allow updating price amounts)
 */
export async function updateStripePrice(
    productId: string,
    amount: number,
    interval: Stripe.PriceCreateParams.Recurring.Interval = "month",
    existingPriceId: string | null = null
): Promise<string> {
    try {
        // If there's an existing price, check if the amount has changed
        if (existingPriceId) {
            const existingPrice = await stripe.prices.retrieve(existingPriceId);

            // Currency is part of "has this price changed", not just the amount.
            // Comparing unit_amount alone meant a currency switch that kept the
            // same integer returned the old price and reported success, so the
            // sync silently did nothing.
            if (
                existingPrice.unit_amount === amount &&
                existingPrice.currency === PLAN_CURRENCY
            ) {
                return existingPriceId;
            }

            // Archive the old price. This does NOT move existing subscriptions
            // off it — they keep billing the archived price until migrated;
            // archiving only stops new subscriptions using it.
            await stripe.prices.update(existingPriceId, { active: false });
        }

        // Create a new price
        const newPrice = await stripe.prices.create({
            product: productId,
            unit_amount: amount,
            currency: PLAN_CURRENCY,
            recurring: {
                interval: interval,
            },
        });

        return newPrice.id;
    } catch (error) {
        logError("Error updating Stripe price:", error);
        throw new Error(`Failed to update Stripe price: ${errorMessage(error)}`);
    }
}

/**
 * Archive a Stripe product (soft delete)
 */
export async function archiveStripeProduct(productId: string): Promise<Stripe.Product> {
    try {
        const product = await stripe.products.update(productId, {
            active: false,
        });

        return product;
    } catch (error) {
        logError("Error archiving Stripe product:", error);
        throw new Error(`Failed to archive Stripe product: ${errorMessage(error)}`);
    }
}

/**
 * Archive a Stripe price
 */
export async function archiveStripePrice(priceId: string): Promise<Stripe.Price> {
    try {
        const price = await stripe.prices.update(priceId, {
            active: false,
        });

        return price;
    } catch (error) {
        logError("Error archiving Stripe price:", error);
        throw new Error(`Failed to archive Stripe price: ${errorMessage(error)}`);
    }
}

/**
 * Create all Stripe resources for a new plan
 */
export async function createPlanStripeResources(
    plan: StripePlanInput
): Promise<PlanStripeResources> {
    try {
        // Create the product
        const productId = await createStripeProduct(plan);

        // Create monthly price if monthly price > 0
        let monthlyPriceId: string | null = null;
        if (plan.monthlyPrice > 0) {
            monthlyPriceId = await createStripePrice(productId, plan.monthlyPrice, "month");
        }

        // Create yearly price if yearly price > 0
        let yearlyPriceId: string | null = null;
        if (plan.yearlyPrice > 0) {
            yearlyPriceId = await createStripePrice(productId, plan.yearlyPrice, "year");
        }

        return {
            stripeProductId: productId,
            stripeMonthlyPriceId: monthlyPriceId,
            stripeYearlyPriceId: yearlyPriceId,
        };
    } catch (error) {
        logError("Error creating plan Stripe resources:", error);
        throw error;
    }
}

/**
 * Update all Stripe resources for a plan
 */
export async function updatePlanStripeResources(
    plan: StripePlanInput,
    existingPlan: PlanStripeResources
): Promise<PlanStripeResources> {
    try {
        // Update the product
        await updateStripeProduct(existingPlan.stripeProductId, plan);

        // Update or create monthly price
        let monthlyPriceId: string | null = existingPlan.stripeMonthlyPriceId;
        if (plan.monthlyPrice > 0) {
            monthlyPriceId = await updateStripePrice(
                existingPlan.stripeProductId,
                plan.monthlyPrice,
                "month",
                existingPlan.stripeMonthlyPriceId
            );
        } else if (existingPlan.stripeMonthlyPriceId) {
            // Archive the old monthly price if it exists
            await archiveStripePrice(existingPlan.stripeMonthlyPriceId);
            monthlyPriceId = null;
        }

        // Update or create yearly price
        let yearlyPriceId: string | null = existingPlan.stripeYearlyPriceId;
        if (plan.yearlyPrice > 0) {
            yearlyPriceId = await updateStripePrice(
                existingPlan.stripeProductId,
                plan.yearlyPrice,
                "year",
                existingPlan.stripeYearlyPriceId
            );
        } else if (existingPlan.stripeYearlyPriceId) {
            // Archive the old yearly price if it exists
            await archiveStripePrice(existingPlan.stripeYearlyPriceId);
            yearlyPriceId = null;
        }

        return {
            stripeProductId: existingPlan.stripeProductId,
            stripeMonthlyPriceId: monthlyPriceId,
            stripeYearlyPriceId: yearlyPriceId,
        };
    } catch (error) {
        logError("Error updating plan Stripe resources:", error);
        throw error;
    }
}

/**
 * Archive all Stripe resources for a plan
 */
export async function archivePlanStripeResources(
    plan: Pick<PlanStripeResources, "stripeProductId">
): Promise<boolean> {
    try {
        // Archive the product (this also archives associated prices)
        if (plan.stripeProductId) {
            await archiveStripeProduct(plan.stripeProductId);
        }

        return true;
    } catch (error) {
        logError("Error archiving plan Stripe resources:", error);
        throw error;
    }
}
