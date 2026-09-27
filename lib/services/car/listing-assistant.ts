import * as carRepository from "@/lib/repositories/car";
import * as billingRepository from "@/lib/repositories/billing";
import * as aiUsageRepository from "@/lib/repositories/ai-usage";
import { AI_FEATURES } from "@/lib/ai/features";
import { buildListingFacts } from "@/lib/ai/grounding";
import type { CapacityPriority } from "@/lib/ai/breaker";
import { answerListingQuestion } from "@/lib/services/ai/answerListingQuestion";
import { dealershipPlaceName } from "@/lib/locations/names";
import { NotFoundError } from "@/lib/utils/errors";
import type { Locale } from "@/i18n/routing";

/**
 * The buyer assistant on a public listing: whether a listing offers it, and
 * asking it. Public and unauthenticated, but billed to the dealer who owns
 * the car — so the dealer's plan decides, never anything the buyer sends.
 */

/** What a buyer is shown. Only `answered` carries model text. */
export type AssistantReply =
  | { status: "answered"; answer: string }
  | { status: "notInListing" }
  | { status: "unavailable" };

interface Allowance {
  offered: boolean;
  priority: CapacityPriority;
}

/**
 * Whether this dealer's plan offers the assistant right now: enabled, and
 * answers left this month. Same limit semantics as withUsageLimit — -1 is
 * unlimited, a missing limit is 0 — but a boolean, because a buyer is not the
 * one to be shown "upgrade your plan".
 */
async function allowanceFor(organizationId: string): Promise<Allowance> {
  const subscription = await billingRepository.findActiveSubscription(organizationId);
  const plan = subscription?.plan;
  // Free-plan dealers run at low priority, so buyers on their listings cannot
  // push paying dealers into "AI busy" — the same rule as aiCallerFor.
  const priority: CapacityPriority = plan?.monthlyPrice ? "standard" : "low";

  const features = (plan?.features ?? {}) as Record<string, unknown>;
  const config = features.aiAssistant as { enabled?: boolean; limit?: number } | undefined;
  if (!config?.enabled) return { offered: false, priority };

  const limit = config.limit ?? 0;
  if (limit === -1) return { offered: true, priority };
  if (limit <= 0) return { offered: false, priority };

  const used = await aiUsageRepository.countOrgAiCallsThisMonth(organizationId, [
    AI_FEATURES.listingQA,
  ]);
  return { offered: used < limit, priority };
}

/** Whether the listing page should show the assistant at all. */
export async function isListingAssistantOffered(organizationId: string): Promise<boolean> {
  return (await allowanceFor(organizationId)).offered;
}

/**
 * Answer a buyer's question about one car.
 *
 * `currentOrganizationId` is the dealership subdomain being browsed, if any,
 * from getCurrentOrganization — never client input. On a subdomain a car of
 * another dealer is not found, exactly as the detail page treats it.
 *
 * The allowance is re-checked here rather than trusted from page render: the
 * page may have been open for an hour, and this is what the dealer pays for.
 */
export async function askAboutListing(
  carId: string,
  question: string,
  locale: Locale,
  currentOrganizationId: string | null
): Promise<AssistantReply> {
  const car = await carRepository.findCarForAssistant(carId);
  if (!car || (currentOrganizationId && car.organizationId !== currentOrganizationId)) {
    throw new NotFoundError("Car");
  }

  const allowance = await allowanceFor(car.organizationId);
  if (!allowance.offered) return { status: "unavailable" };

  const { organization } = car;
  const facts = buildListingFacts({
    ...car,
    // Decimal to number: whole EGP, well inside the safe-integer range.
    price: Number(car.price),
    dealership: {
      name: organization.name,
      place: dealershipPlaceName(organization, locale) || null,
      address: organization.address,
      phone: organization.phone,
    },
    workingHours: organization.workingHours,
  });

  const reply = await answerListingQuestion(question, facts, locale, {
    organizationId: car.organizationId,
    // A buyer, not a member of the dealership: attribution stops at the org.
    userId: null,
    priority: allowance.priority,
  });

  return reply.grounded
    ? { status: "answered", answer: reply.answer }
    : { status: "notInListing" };
}
