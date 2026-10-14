export const AI_FEATURES = {
  /** Dealer uploads a car photo; the model extracts the listing fields. */
  carListingFromImage: "carListingFromImage",
  /** Buyer uploads a photo on the hero; the model extracts search filters. */
  searchFiltersFromImage: "searchFiltersFromImage",
  /**
   * Buyer describes the car they want in the hero search ("automatic SUV
   * under 1.5 million"); the model turns it into filters. Public: metered,
   * billed to no one, rate-limited per visitor.
   */
  searchFiltersFromText: "searchFiltersFromText",
  /**
   * A dealer saves a listing written in one language; the model writes the
   * other. Bills to the dealer's AI allowance like the photo extraction.
   */
  listingTranslation: "listingTranslation",
  /**
   * Alt text for a car's photos, both languages, after a save. Metered but
   * deliberately NOT billed to the dealer: it serves buyers (screen readers)
   * and search, not the dealer, who never asked for it.
   */
  carImageAltText: "carImageAltText",
  /**
   * A dealership's own words — description and address — in the language the
   * dealer did not write them in, after a profile save (or on the storefront's
   * first view, for text saved before this existed). Metered and deliberately
   * billed to no one: a short paragraph and an address per dealership that
   * rarely change, written for buyers — billing it would leave free-plan
   * storefronts in one language. Runs at low priority.
   */
  dealershipProfileTranslation: "dealershipProfileTranslation",
  /** On-demand advice for what the listing-quality rules flagged. Billed. */
  listingQualityCoach: "listingQualityCoach",
  /**
   * A buyer asks a question on a public listing; the model answers from that
   * car's record or says the listing does not say. Metered, and never
   * counted against the dealer's AI listing allowance; there is no monthly cap
   * on answers — the plan's `aiAssistant.enabled` is the only gate.
   */
  listingQA: "listingQA",
  /**
   * A buyer or a dealer taps "Translate" on a chat message in the other
   * language. Metered, and deliberately billed to no one (owner's decision,
   * 2026-09-29): bounded by a per-user rate limit and the provider caps, and
   * run at low priority so it cannot crowd out the paid features.
   */
  chatTranslation: "chatTranslation",
  /**
   * A chat message the free screen (lib/utils/chat-screen) could not clear is
   * judged scam / spam / abuse / fine. Platform-initiated, so metered and
   * billed to no one, at low priority like translation.
   */
  chatModeration: "chatModeration",
  /**
   * The paragraph atop a dealership's weekly summary email. Platform-initiated
   * — the dealer did not ask for it — so metered and billed to no one.
   */
  weeklyDigest: "weeklyDigest",
  /**
   * The evaluation suites' judge grading a reply (lib/ai/evaluation/judge.ts).
   * Never runs in production; metered like any call, billed to no one.
   */
  evalJudge: "evalJudge",
  /**
   * A buyer question turned into a vector — to fold a rephrased repeat into
   * the question already in the dealer's inbox, rank the dealer's answers by
   * meaning, and suggest an answer given on another car. Metered, billed to
   * no one: the platform's housekeeping, not a dealer request.
   */
  questionEmbedding: "questionEmbedding",
  /**
   * A listing turned into a vector for meaning-based search. Metered, billed
   * to no one: written on save and by the backfill, never asked for.
   */
  carEmbedding: "carEmbedding",
  /**
   * A buyer's search text turned into a vector, to rank cars by what they
   * meant. Public and anonymous: metered, billed to no one, at low priority
   * in the embedding pool so it can never crowd out the dealers' own jobs.
   */
  carSearchQuery: "carSearchQuery",
} as const;

export type AiFeature = (typeof AI_FEATURES)[keyof typeof AI_FEATURES];

/**
 * Who may call a feature, what it costs whom, and how urgently it runs — the
 * one place these are decided, read by authorizeDealerAiFeature and
 * publicAiCaller (lib/services/ai/authorize.ts). Before this the answers were
 * scattered through each entry point's hand-stacked gates, and they drifted:
 * the anonymous photo search ran at the priority reserved for paying dealers.
 */
export interface AiFeaturePolicy {
  /** A dealer acting for their dealership, a buyer (often anonymous), or the platform itself. */
  audience: "dealer" | "buyer" | "platform";
  /** The plan feature a dealer's call needs switched on; null when none. */
  planGate: "aiProcessing" | null;
  /** Counted against the dealer's monthly AI listing allowance (cars saved with AI help). */
  billedToDealer: boolean;
  /** Capacity priority: "plan" is standard on a paid plan in effect, low on the free plan. */
  priority: "plan" | "standard" | "low";
}

const DEALER_BILLED: AiFeaturePolicy = { audience: "dealer", planGate: "aiProcessing", billedToDealer: true, priority: "plan" };
const PUBLIC_LOW: AiFeaturePolicy = { audience: "buyer", planGate: null, billedToDealer: false, priority: "low" };
const PLATFORM_LOW: AiFeaturePolicy = { audience: "platform", planGate: null, billedToDealer: false, priority: "low" };

export const AI_FEATURE_POLICY: Record<AiFeature, AiFeaturePolicy> = {
  carListingFromImage: DEALER_BILLED,
  listingTranslation: DEALER_BILLED,
  listingQualityCoach: DEALER_BILLED,
  // Anonymous visitors must never take the capacity paying dealers wait on.
  searchFiltersFromImage: PUBLIC_LOW,
  searchFiltersFromText: PUBLIC_LOW,
  carSearchQuery: PUBLIC_LOW,
  // Gated by the dealership's `aiAssistant`, never billed; the priority
  // follows the dealer's plan (lib/services/car/listing-assistant.ts).
  listingQA: { audience: "buyer", planGate: null, billedToDealer: false, priority: "plan" },
  chatTranslation: PUBLIC_LOW,
  chatModeration: PLATFORM_LOW,
  carImageAltText: PLATFORM_LOW,
  dealershipProfileTranslation: PLATFORM_LOW,
  weeklyDigest: PLATFORM_LOW,
  questionEmbedding: PLATFORM_LOW,
  carEmbedding: PLATFORM_LOW,
  evalJudge: PLATFORM_LOW,
};

/** The features a dealer's monthly AI allowance counts — derived, so it cannot drift from the policy. */
export const DEALER_BILLED_FEATURES: AiFeature[] = (Object.keys(AI_FEATURE_POLICY) as AiFeature[]).filter(
  (feature) => AI_FEATURE_POLICY[feature].billedToDealer
);
