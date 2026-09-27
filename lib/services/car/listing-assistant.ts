import * as carRepository from "@/lib/repositories/car";
import * as billingRepository from "@/lib/repositories/billing";
import * as aiUsageRepository from "@/lib/repositories/ai-usage";
import { AI_FEATURES } from "@/lib/ai/features";
import { buildListingFacts, closestByPrice, summarizeMarketPrices, type MarketPrices, type OtherCar } from "@/lib/ai/grounding";
import type { CapacityPriority } from "@/lib/ai/breaker";
import { answerListingQuestion } from "@/lib/services/ai/answerListingQuestion";
import { dealershipPlaceName } from "@/lib/locations/names";
import * as buyerQuestionRepository from "@/lib/repositories/buyer-question";
import { questionKey } from "@/lib/utils/question-key";
import { NotFoundError, logError } from "@/lib/utils/errors";
import { licenseMonth, statedDisclosures, statedTerms } from "@/lib/utils/car-disclosures";
import { parseImageAlts } from "@/lib/utils/image-alts";
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

  const price = Number(car.price);
  const [allowance, dealerAnswers, otherCars, marketPrices] = await Promise.all([
    allowanceFor(car.organizationId),
    dealerAnswersFor(car.id, car.organizationId),
    otherCarsFor(car.organizationId, car.id, price),
    marketPricesFor({ ...car, price }),
  ]);
  if (!allowance.offered) return { status: "unavailable" };

  const { organization } = car;
  const facts = buildListingFacts({
    ...car,
    // Decimal to number: whole EGP, well inside the safe-integer range.
    price,
    listedOn: car.createdAt.toISOString().slice(0, 10),
    photos: photoDescriptions(car.images, car.imageAlts, locale),
    dealership: {
      name: organization.name,
      place: dealershipPlaceName(organization, locale) || null,
      address: organization.address,
      phone: organization.phone,
      website: organization.website,
      about: organization.description,
      rating:
        organization.totalReviews > 0
          ? { average: Math.round(organization.averageRating * 10) / 10, reviews: organization.totalReviews }
          : null,
    },
    workingHours: organization.workingHours,
    history: statedDisclosures({
      ...car,
      licenseValidUntil: licenseMonth(car.licenseValidUntil),
    }),
    terms: statedTerms(organization),
    otherCars,
    marketPrices,
    dealerAnswers,
  });

  const reply = await answerListingQuestion(question, facts, locale, {
    organizationId: car.organizationId,
    // A buyer, not a member of the dealership: attribution stops at the org.
    userId: null,
    priority: allowance.priority,
  });

  if (reply.grounded) return { status: "answered", answer: reply.answer };

  await recordForDealer({
    organizationId: car.organizationId,
    carId: car.id,
    question,
    questionKey: questionKey(question),
    locale,
  });
  return { status: "notInListing" };
}

/**
 * The dealer's answers, or none. They improve an answer but are not needed
 * for one, so a failed read — or a deploy that reached production before its
 * migration did — answers from the listing alone instead of failing.
 */
async function dealerAnswersFor(carId: string, organizationId: string) {
  try {
    return await buyerQuestionRepository.findAnswersForCar(carId, organizationId);
  } catch (error) {
    logError("Loading dealer answers failed; answering from the listing alone", error);
    return [];
  }
}

/**
 * What the photos show, in display order and the reader's language, falling
 * back to the other language rather than leaving a photo out.
 */
function photoDescriptions(images: string[], stored: unknown, locale: Locale): string[] {
  const alts = parseImageAlts(stored);
  return images.flatMap((url) => {
    const alt = alts[url];
    if (!alt) return [];
    const text = (locale === "ar" ? alt.ar || alt.en : alt.en || alt.ar).trim();
    return text ? [text] : [];
  });
}

/** The dealership's other cars closest in price, or none if the read fails. */
async function otherCarsFor(organizationId: string, carId: string, price: number): Promise<OtherCar[]> {
  try {
    const cars = await carRepository.findOtherAvailableCars(organizationId, carId);
    return closestByPrice(
      cars.map((c) => ({ ...c, price: Number(c.price) })),
      price
    );
  } catch (error) {
    logError("Loading the dealership's other cars failed; answering without them", error);
    return [];
  }
}

/** How comparable listings are priced, or null with too few or a failed read. */
async function marketPricesFor(car: {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  priceCurrency: string;
}): Promise<MarketPrices | null> {
  try {
    const prices = await carRepository.findComparablePrices({
      make: car.make,
      model: car.model,
      year: car.year,
      excludeCarId: car.id,
      currency: car.priceCurrency,
    });
    return summarizeMarketPrices(prices, { price: car.price, year: car.year, currency: car.priceCurrency });
  } catch (error) {
    logError("Loading comparable prices failed; answering without them", error);
    return null;
  }
}

/**
 * Put a declined question in the dealer's inbox. Awaited — a detached write
 * can be killed when the function returns — but never allowed to fail the
 * buyer's request: they still get "ask the dealer" either way.
 */
async function recordForDealer(input: buyerQuestionRepository.DeclinedQuestion) {
  try {
    await buyerQuestionRepository.recordDeclinedQuestion(input);
  } catch (error) {
    logError("Recording a declined buyer question failed", error);
  }
}
