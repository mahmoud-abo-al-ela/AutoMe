import * as carRepository from "@/lib/repositories/car";
import * as billingRepository from "@/lib/repositories/billing";
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
import type { Trace } from "@/lib/utils/dev-trace";

/**
 * The buyer assistant on a public listing: whether a listing offers it, and
 * asking it. Public and unauthenticated, but billed to the dealer who owns
 * the car — so the dealer's plan decides, never anything the buyer sends.
 */

/**
 * What a buyer is shown. A decline may carry the model's own wording for it,
 * already checked by declineText; without one the page shows fixed copy.
 */
export type AssistantReply =
  | { status: "answered"; answer: string }
  | { status: "notInListing"; message?: string }
  /** Not a question about this car; not filed for the dealer. */
  | { status: "offTopic"; message?: string }
  /** Answered without the model — see classifyBuyerMessage. */
  | { status: "smallTalk"; kind: "greeting" | "thanks" | "noise" }
  | { status: "unavailable" };

interface Allowance {
  offered: boolean;
  priority: CapacityPriority;
}

/**
 * Whether this dealer's plan offers the assistant. There is no monthly cap on
 * answers (the owner's decision, 2026-09-28): a buyer asking questions is the
 * point, and the dealer should never find the assistant switched off halfway
 * through a month. Abuse and cost are bounded elsewhere — Arcjet per IP and per
 * car, the no-model replies for greetings and noise, and each provider's caps.
 */
async function allowanceFor(organizationId: string): Promise<Allowance> {
  const subscription = await billingRepository.findActiveSubscription(organizationId);
  const plan = subscription?.plan;
  // Free-plan dealers run at low priority, so buyers on their listings cannot
  // push paying dealers into "AI busy" — the same rule as aiCallerFor.
  const priority: CapacityPriority = plan?.monthlyPrice ? "standard" : "low";

  const features = (plan?.features ?? {}) as Record<string, unknown>;
  // Any stored `limit` is ignored: plans saved before the cap was removed
  // still carry one.
  const config = features.aiAssistant as { enabled?: boolean } | undefined;
  return { offered: Boolean(config?.enabled), priority };
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
 * The plan is re-checked here rather than trusted from page render: the page
 * may have been open for an hour.
 */
export async function askAboutListing(
  carId: string,
  question: string,
  locale: Locale,
  currentOrganizationId: string | null,
  trace?: Trace
): Promise<AssistantReply> {
  const car = await carRepository.findCarForAssistant(carId);
  if (!car || (currentOrganizationId && car.organizationId !== currentOrganizationId)) {
    throw new NotFoundError("Car");
  }
  trace?.step(`car ✓ ${car.year} ${car.make} ${car.model} · dealership ${car.organization.name}`);

  const price = Number(car.price);
  const [allowance, dealerAnswers, otherCars, marketPrices] = await Promise.all([
    allowanceFor(car.organizationId),
    dealerAnswersFor(car.id, car.organizationId),
    otherCarsFor(car.organizationId, car.id, price),
    marketPricesFor({ ...car, price }),
  ]);
  if (!allowance.offered) {
    trace?.end("the dealership's plan does not include the assistant — no AI call");
    return { status: "unavailable" };
  }
  trace?.step(
    `plan ✓ assistant enabled (${allowance.priority} priority) · data: ` +
      `${otherCars === null ? "other cars ✗ (read failed)" : `${otherCars.length} other cars`} · ` +
      `${marketPrices ? `price range ✓ (${marketPrices.listings} similar)` : "price range ✗ (under 3 similar)"} · ` +
      `${dealerAnswers.length} dealer answers`
  );

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

  trace?.step(`record: ${Object.keys(facts).length} facts [${Object.keys(facts).join(", ")}]`);

  const reply = await answerListingQuestion(question, facts, locale, {
    organizationId: car.organizationId,
    // A buyer, not a member of the dealership: attribution stops at the org.
    userId: null,
    priority: allowance.priority,
  }, trace);

  if (reply.grounded) {
    trace?.end(`answered: "${reply.answer}"`);
    return { status: "answered", answer: reply.answer };
  }
  // Not a question about the car: the dealer has nothing to answer.
  if (reply.offTopic) {
    trace?.end(`off-topic — not filed for the dealer: "${reply.message ?? "(fixed copy)"}"`);
    return reply.message ? { status: "offTopic", message: reply.message } : { status: "offTopic" };
  }

  trace?.step("declined → filing the question in the dealer's Buyer Questions inbox");
  await recordForDealer({
    organizationId: car.organizationId,
    carId: car.id,
    question,
    questionKey: questionKey(question),
    locale,
  });
  trace?.end(`declined + "ask the dealer": "${reply.message ?? "(fixed copy)"}"`);
  return reply.message ? { status: "notInListing", message: reply.message } : { status: "notInListing" };
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

/**
 * The dealership's other cars closest in price. Null — not an empty list —
 * when the read fails: "none for sale" is a claim, and only a successful read
 * can make it.
 */
async function otherCarsFor(organizationId: string, carId: string, price: number): Promise<OtherCar[] | null> {
  try {
    const cars = await carRepository.findOtherAvailableCars(organizationId, carId);
    return closestByPrice(
      cars.map((c) => ({ ...c, price: Number(c.price) })),
      price
    );
  } catch (error) {
    logError("Loading the dealership's other cars failed; answering without them", error);
    return null;
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
