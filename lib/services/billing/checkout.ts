import type { BillingPeriod, PaymentPurpose } from "@/lib/generated/prisma";
import type { Locale } from "@/i18n/routing";
import * as billingRepo from "@/lib/repositories/billing";
import * as paymentRepo from "@/lib/repositories/payment";
import { PaymobApiError, checkoutUrl, createIntention, paymobConfig } from "@/lib/services/paymob";
import { EGYPT_DIALING_CODE, isEgyptNationalPhone, toNationalEgyptPhone } from "@/lib/utils/phone";
import { NotFoundError, ServiceUnavailableError, ValidationError, logError } from "@/lib/utils/errors";

/**
 * Start paying for a plan: a PENDING Payment row, a Paymob intention that
 * carries its id, and the URL of Paymob's checkout page.
 *
 * Nothing changes on the subscription here. The payment takes effect when
 * Paymob confirms it (settle.ts), through the callback or, if that is late,
 * through the success page asking Paymob directly.
 *
 * Callers own auth, ownership and rate limiting (server-action-guard).
 */

/** How long the checkout page can be paid. A later attempt starts a new checkout. */
const CHECKOUT_TTL_SECONDS = 60 * 60;

/** Paymob's placeholder for billing fields it requires but does not check on a card payment. */
const NOT_APPLICABLE = "NA";

export interface CheckoutPayer {
  userId: string;
  name?: string | null;
  email?: string | null;
}

/** Who is billed: the dealership being created, or the one paying. */
export interface CheckoutDealership {
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface CheckoutBase {
  planId: string;
  billingPeriod: BillingPeriod;
  /** The language of the page Paymob returns the buyer to. */
  locale: Locale;
  payer: CheckoutPayer;
  dealership: CheckoutDealership;
}

export type CheckoutInput =
  | (CheckoutBase & { purpose: "SIGNUP"; onboardingSessionId: string })
  | (CheckoutBase & {
      purpose: Exclude<PaymentPurpose, "SIGNUP">;
      organizationId: string;
      organizationSlug: string;
    });

export interface Checkout {
  paymentId: string;
  url: string;
}

/**
 * The public origin Paymob calls back and returns buyers to. Required in
 * production; in development it falls back to the local server, as the rest of
 * the app does. Paymob cannot call localhost back, so there the success page
 * confirms the payment by asking Paymob (confirm.ts).
 */
function appUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  const url = configured || (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
  if (!url) {
    throw new ServiceUnavailableError("NEXT_PUBLIC_APP_URL is not configured", {
      key: "errors.billing.notConfigured",
    });
  }
  return url;
}

/** International form for Paymob ("+201001234567"), or its placeholder. */
export function billingPhone(phone: string | null | undefined): string {
  const national = toNationalEgyptPhone(phone ?? "");
  return isEgyptNationalPhone(national) ? `+${EGYPT_DIALING_CODE}${national}` : NOT_APPLICABLE;
}

/** Paymob wants a first and last name; a single word fills the first. */
export function billingName(name: string | null | undefined, fallback: string) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { firstName: fallback, lastName: NOT_APPLICABLE };
  return { firstName: words[0], lastName: words.slice(1).join(" ") || NOT_APPLICABLE };
}

export function planPrice(
  plan: { monthlyPrice: number; yearlyPrice: number },
  period: BillingPeriod
): number {
  return period === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
}

function returnPath(input: CheckoutInput, paymentId: string): string {
  const ref = `ref=${encodeURIComponent(paymentId)}`;
  return input.purpose === "SIGNUP"
    ? `/${input.locale}/onboarding/success?${ref}`
    : `/${input.locale}/org/${input.organizationSlug}/billing/success?${ref}`;
}

export async function startCheckout(input: CheckoutInput): Promise<Checkout> {
  // Configuration first: a misconfigured deployment must not leave a PENDING
  // row behind for every click.
  const { cardIntegrationId, walletIntegrationId } = paymobConfig();
  const origin = appUrl();

  const plan = await billingRepo.findPlanById(input.planId);
  if (!plan || !plan.isActive) throw new NotFoundError("Plan");

  const amountCents = planPrice(plan, input.billingPeriod);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    // The free plan is never paid for; a paid plan without a price is a
    // configuration mistake, not something to charge 0 for.
    throw new ValidationError(`Plan ${plan.type} has no ${input.billingPeriod} price`, null, {
      key: "errors.billing.notConfigured",
    });
  }

  const payment = await paymentRepo.createPayment({
    purpose: input.purpose,
    planId: plan.id,
    billingPeriod: input.billingPeriod,
    amountCents,
    currency: "EGP",
    userId: input.payer.userId,
    ...(input.purpose === "SIGNUP"
      ? { onboardingSessionId: input.onboardingSessionId }
      : { organizationId: input.organizationId }),
  });

  const { firstName, lastName } = billingName(input.payer.name, input.dealership.name);
  const periodLabel = input.billingPeriod === "YEARLY" ? "yearly" : "monthly";

  const intentionWith = (paymentMethods: number[]) =>
    createIntention({
      amountCents,
      currency: "EGP",
      paymentMethods,
      items: [{ name: `AutoMe ${plan.name} (${periodLabel})`, amountCents }],
      billing: {
        firstName,
        lastName,
        email: input.payer.email || input.dealership.email || NOT_APPLICABLE,
        phoneNumber: billingPhone(input.dealership.phone),
      },
      specialReference: payment.id,
      notificationUrl: `${origin}/api/webhooks/paymob`,
      redirectionUrl: `${origin}${returnPath(input, payment.id)}`,
      expiresInSeconds: CHECKOUT_TTL_SECONDS,
    });

  try {
    let intention;
    try {
      // Card always; mobile wallets too when an integration is configured. The
      // buyer picks on Paymob's page.
      intention = await intentionWith(
        walletIntegrationId ? [cardIntegrationId, walletIntegrationId] : [cardIntegrationId]
      );
    } catch (error) {
      // A wallet integration Paymob has not enabled for Unified Checkout must
      // never cost a card payment: say so in the log and offer card alone.
      if (!walletIntegrationId || !(error instanceof PaymobApiError) || error.status !== 404) throw error;
      logError(`Paymob refused wallet integration ${walletIntegrationId}; checkout offers card only:`, error);
      intention = await intentionWith([cardIntegrationId]);
    }
    if (walletIntegrationId && !intention.offeredIntegrationIds.includes(walletIntegrationId)) {
      // Paymob accepted the checkout but left wallets out: the integration is
      // not enabled for Unified Checkout on the account (Paymob support).
      console.warn(`Paymob did not offer wallet integration ${walletIntegrationId} at checkout`);
    }

    await paymentRepo.setPaymentProviderOrder(payment.id, intention.orderId);
    return { paymentId: payment.id, url: checkoutUrl(intention.clientSecret) };
  } catch (error) {
    logError("Paymob checkout could not be created:", error);
    await paymentRepo.markPaymentSetupFailed(payment.id).catch((markError) => logError(markError));
    throw new ServiceUnavailableError("Payment setup failed", { key: "errors.billing.paymentSetupFailed" });
  }
}
