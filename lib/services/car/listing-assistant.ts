import * as carRepository from "@/lib/repositories/car";
import * as billingRepository from "@/lib/repositories/billing";
import {
  COMPARISONS,
  buildListingFacts,
  closestByPrice,
  comparisonFor,
  summarizeMarketPrices,
  type MarketPrices,
  type OtherCar,
} from "@/lib/ai/grounding";
import type { CapacityPriority } from "@/lib/ai/breaker";
import {
  answerListingQuestion,
  type ListingAction,
  type PastExchange,
} from "@/lib/services/ai/answerListingQuestion";
import { dealershipPlaceName } from "@/lib/locations/names";
import * as buyerQuestionRepository from "@/lib/repositories/buyer-question";
import * as assistantAnswerRepository from "@/lib/repositories/assistant-answer";
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
  | {
      status: "answered";
      answer: string;
      /** For rating it; absent when it could not be kept. */
      answerId?: string;
      actions?: AssistantAction[];
      cars?: SuggestedCar[];
    }
  | { status: "notInListing"; message?: string }
  /** Not a question about this car; not filed for the dealer. */
  | { status: "offTopic"; message?: string }
  /** Answered without the model — see classifyBuyerMessage. */
  | { status: "smallTalk"; kind: "greeting" | "thanks" | "noise" }
  | { status: "unavailable" };

/** A button under an answer. The href is built here from the dealer's row. */
export type AssistantAction =
  | { kind: "directions"; href: string }
  | { kind: "call"; href: string; phone: string }
  /** An in-app path, without the locale — rendered with the locale-aware Link. */
  | { kind: "testDrive"; href: string };

/** Another of the dealership's cars an answer names, as a card linking to it. */
export interface SuggestedCar {
  id: string;
  year: number;
  make: string;
  model: string;
  /** Whole units of `currency`. */
  price: number;
  currency: string;
  image: string | null;
}

/** The dealership's other cars as loaded: what the model sees, plus the card's link and photo. */
type OtherCarRow = OtherCar & { id: string; image: string | null };

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
  options: { trace?: Trace; history?: PastExchange[] } = {}
): Promise<AssistantReply> {
  const { trace, history = [] } = options;
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
      `${marketPrices ? `price range ✓ (${marketPrices.listings} × ${marketPrices.compared.model ?? marketPrices.compared.bodyType})` : "price range ✗ (under 3 comparable)"} · ` +
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
  }, { trace, history });

  if (reply.grounded) {
    trace?.end(`answered: "${reply.answer}"`);
    const actions = (reply.actions ?? []).flatMap((kind) => actionFor(kind, car, organization));
    // A ref is a 1-based position in the otherCars the model was given.
    const cars = (reply.carRefs ?? []).flatMap((ref) => {
      const row = otherCars?.[ref - 1];
      return row ? [suggestedCar(row, car.priceCurrency)] : [];
    });
    const answerId = await keepAnswer({
      organizationId: car.organizationId,
      carId: car.id,
      question: (reply.standalone ?? question).slice(0, 300),
      answer: reply.answer.slice(0, 600),
      locale,
    });
    return {
      status: "answered",
      answer: reply.answer,
      ...(answerId && { answerId }),
      ...(actions.length > 0 && { actions }),
      ...(cars.length > 0 && { cars }),
    };
  }
  // Not a question about the car: the dealer has nothing to answer.
  if (reply.offTopic) {
    trace?.end(`off-topic — not filed for the dealer: "${reply.message ?? "(fixed copy)"}"`);
    return reply.message ? { status: "offTopic", message: reply.message } : { status: "offTopic" };
  }

  trace?.step("declined → filing the question in the dealer's Buyer Questions inbox");
  // The question as it stands alone: a dealer cannot answer "وبكام؟".
  const asked = reply.standalone ?? question;
  await recordForDealer({
    organizationId: car.organizationId,
    carId: car.id,
    question: asked,
    questionKey: questionKey(asked),
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
async function otherCarsFor(organizationId: string, carId: string, price: number): Promise<OtherCarRow[] | null> {
  try {
    const cars = await carRepository.findOtherAvailableCars(organizationId, carId);
    return closestByPrice(
      cars.map(({ images, ...c }) => ({ ...c, price: Number(c.price), image: images?.[0] ?? null })),
      price
    );
  } catch (error) {
    logError("Loading the dealership's other cars failed; answering without them", error);
    return null;
  }
}

/**
 * A button's target, from the dealer's own row — never from the model, which
 * only chose that the button fits. answerListingQuestion already dropped any
 * button the row cannot back; this re-checks, since it builds the href.
 */
function actionFor(
  kind: ListingAction,
  car: { id: string; status: string },
  organization: { address: string | null; phone: string | null }
): AssistantAction[] {
  if (kind === "testDrive" && car.status === "AVAILABLE") {
    // The same page the listing's own test-drive button opens; middleware
    // sends a signed-out buyer through sign-in and back.
    return [{ kind, href: `/test-drive?carId=${car.id}` }];
  }
  if (kind === "directions" && organization.address) {
    return [{ kind, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(organization.address)}` }];
  }
  if (kind === "call" && organization.phone) {
    return [{ kind, href: `tel:${organization.phone.replace(/[^\d+]/g, "")}`, phone: organization.phone }];
  }
  return [];
}

function suggestedCar(row: OtherCarRow, currency: string): SuggestedCar {
  const { id, year, make, model, price, image } = row;
  return { id, year, make, model, price, currency, image };
}

/**
 * How comparable listings are priced, trying each of COMPARISONS in turn
 * until one finds enough; null if none does, or a read fails.
 */
async function marketPricesFor(car: {
  id: string;
  make: string;
  model: string;
  bodyType: string;
  year: number;
  price: number;
  priceCurrency: string;
}): Promise<MarketPrices | null> {
  try {
    for (const level of COMPARISONS) {
      const compared = comparisonFor(car, level);
      const prices = await carRepository.findComparablePrices({
        make: car.make,
        model: compared.model,
        bodyType: compared.bodyType,
        year: car.year,
        yearSpan: level.yearSpan,
        excludeCarId: car.id,
        currency: car.priceCurrency,
      });
      const summary = summarizeMarketPrices(prices, { price: car.price, currency: car.priceCurrency }, compared);
      if (summary) return summary;
    }
    return null;
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
/**
 * Keep the answer so the buyer can rate it. Best effort: without an id the
 * answer is still shown, just without 👍/👎.
 */
async function keepAnswer(input: assistantAnswerRepository.AnswerToKeep): Promise<string | null> {
  try {
    return await assistantAnswerRepository.recordAssistantAnswer(input);
  } catch (error) {
    logError("Keeping an assistant answer failed; shown without a rating", error);
    return null;
  }
}

/**
 * A buyer rates an answer. Rated once: a repeat, or an id that does not
 * exist, changes nothing. A 👎 files the question in the dealer's inbox, as a
 * declined one would be — the dealer's answer then becomes a fact the
 * assistant cites instead.
 */
export async function rateListingAnswer(answerId: string, helpful: boolean): Promise<void> {
  const rated = await assistantAnswerRepository.rateAssistantAnswer(answerId, helpful);
  if (!rated || helpful) return;
  await recordForDealer({
    organizationId: rated.organizationId,
    carId: rated.carId,
    question: rated.question,
    questionKey: questionKey(rated.question),
    locale: rated.locale,
  });
}

async function recordForDealer(input: buyerQuestionRepository.DeclinedQuestion) {
  try {
    await buyerQuestionRepository.recordDeclinedQuestion(input);
  } catch (error) {
    logError("Recording a declined buyer question failed", error);
  }
}
