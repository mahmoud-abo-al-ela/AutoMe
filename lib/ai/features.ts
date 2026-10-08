export const AI_FEATURES = {
  /** Dealer uploads a car photo; the model extracts the listing fields. */
  carListingFromImage: "carListingFromImage",
  /** Buyer uploads a photo on the hero; the model extracts search filters. */
  searchFiltersFromImage: "searchFiltersFromImage",
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
} as const;

export type AiFeature = (typeof AI_FEATURES)[keyof typeof AI_FEATURES];
