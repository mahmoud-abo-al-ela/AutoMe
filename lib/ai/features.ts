export const AI_FEATURES = {
  /** Dealer uploads a car photo; the model extracts the listing fields. */
  carListingFromImage: "carListingFromImage",
  /** Buyer uploads a photo on the hero; the model extracts search filters. */
  searchFiltersFromImage: "searchFiltersFromImage",
  searchFiltersFromText: "searchFiltersFromText",
  /**
   * A dealer saves a listing written in one language; the model writes the
   * other. Bills to the dealer's AI allowance like the photo extraction.
   */
  listingTranslation: "listingTranslation",
  carImageAltText: "carImageAltText",
  dealershipProfileTranslation: "dealershipProfileTranslation",
  /** On-demand advice for what the listing-quality rules flagged. Billed. */
  listingQualityCoach: "listingQualityCoach",
  listingQA: "listingQA",
  chatTranslation: "chatTranslation",
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
  questionEmbedding: "questionEmbedding",
  /**
   * A listing turned into a vector for meaning-based search. Metered, billed
   * to no one: written on save and by the backfill, never asked for.
   */
  carEmbedding: "carEmbedding",
  carSearchQuery: "carSearchQuery",
} as const;

export type AiFeature = (typeof AI_FEATURES)[keyof typeof AI_FEATURES];

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
