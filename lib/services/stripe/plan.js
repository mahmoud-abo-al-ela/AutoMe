import Stripe from "stripe";
import { logError } from "@/lib/utils/errors";

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
export async function createStripeProduct(plan) {
    try {
        const product = await stripe.products.create({
            name: plan.name,
            description: `${plan.type} plan - ${plan.name}`,
            metadata: {
                planId: plan.id,
                planType: plan.type,
            },
        });

        return product.id;
    } catch (error) {
        logError("Error creating Stripe product:", error);
        throw new Error(`Failed to create Stripe product: ${error.message}`);
    }
}

/**
 * Create a Stripe price for a product
 */
export async function createStripePrice(productId, amount, interval = "month") {
    try {
        const price = await stripe.prices.create({
            product: productId,
            unit_amount: amount,
            currency: "usd",
            recurring: {
                interval: interval,
            },
        });

        return price.id;
    } catch (error) {
        logError("Error creating Stripe price:", error);
        throw new Error(`Failed to create Stripe price: ${error.message}`);
    }
}

/**
 * Update a Stripe product
 */
export async function updateStripeProduct(productId, data) {
    try {
        const product = await stripe.products.update(productId, {
            name: data.name,
            description: `${data.type} plan - ${data.name}`,
            metadata: {
                planId: data.id,
                planType: data.type,
            },
        });

        return product;
    } catch (error) {
        logError("Error updating Stripe product:", error);
        throw new Error(`Failed to update Stripe product: ${error.message}`);
    }
}

/**
 * Update or create a Stripe price
 * If the amount changes, we need to create a new price (Stripe doesn't allow updating price amounts)
 */
export async function updateStripePrice(productId, amount, interval = "month", existingPriceId = null) {
    try {
        // If there's an existing price, check if the amount has changed
        if (existingPriceId) {
            const existingPrice = await stripe.prices.retrieve(existingPriceId);

            // If amount is the same, no need to create a new price
            if (existingPrice.unit_amount === amount) {
                return existingPriceId;
            }

            // Archive the old price
            await stripe.prices.update(existingPriceId, { active: false });
        }

        // Create a new price
        const newPrice = await stripe.prices.create({
            product: productId,
            unit_amount: amount,
            currency: "usd",
            recurring: {
                interval: interval,
            },
        });

        return newPrice.id;
    } catch (error) {
        logError("Error updating Stripe price:", error);
        throw new Error(`Failed to update Stripe price: ${error.message}`);
    }
}

/**
 * Archive a Stripe product (soft delete)
 */
export async function archiveStripeProduct(productId) {
    try {
        const product = await stripe.products.update(productId, {
            active: false,
        });

        return product;
    } catch (error) {
        logError("Error archiving Stripe product:", error);
        throw new Error(`Failed to archive Stripe product: ${error.message}`);
    }
}

/**
 * Archive a Stripe price
 */
export async function archiveStripePrice(priceId) {
    try {
        const price = await stripe.prices.update(priceId, {
            active: false,
        });

        return price;
    } catch (error) {
        logError("Error archiving Stripe price:", error);
        throw new Error(`Failed to archive Stripe price: ${error.message}`);
    }
}

/**
 * Create all Stripe resources for a new plan
 */
export async function createPlanStripeResources(plan) {
    try {
        // Create the product
        const productId = await createStripeProduct(plan);

        // Create monthly price if monthly price > 0
        let monthlyPriceId = null;
        if (plan.monthlyPrice > 0) {
            monthlyPriceId = await createStripePrice(productId, plan.monthlyPrice, "month");
        }

        // Create yearly price if yearly price > 0
        let yearlyPriceId = null;
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
export async function updatePlanStripeResources(plan, existingPlan) {
    try {
        // Update the product
        await updateStripeProduct(existingPlan.stripeProductId, plan);

        // Update or create monthly price
        let monthlyPriceId = existingPlan.stripeMonthlyPriceId;
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
        let yearlyPriceId = existingPlan.stripeYearlyPriceId;
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
export async function archivePlanStripeResources(plan) {
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
