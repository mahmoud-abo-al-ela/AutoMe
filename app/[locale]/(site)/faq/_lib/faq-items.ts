/**
 * Order and grouping of the FAQ; every string is in messages/{en,ar}/faq.json,
 * keyed by these ids. Kept out of the page so the message test can walk it.
 *
 * The answers state what the product does today, and each was checked
 * against it: the compare limit is read from the constant the compare tray
 * enforces, sign-up offers email or Google (no Facebook), and the AI answer
 * lists the four features that exist. The English this replaced promised
 * driving-habit analysis, maintenance forecasting and depreciation
 * prediction, none of which were ever built — a translation would have made
 * those claims in two languages. Change an answer when the feature changes.
 */
export const FAQ_CATEGORIES = [
  { key: "buying", items: ["findCar", "compare"] },
  { key: "account", items: ["createAccount", "security"] },
  { key: "features", items: ["wishlist", "ai"] },
] as const;

export const FAQ_AI_POINTS = [
  "photoSearch",
  "listingQuestions",
  "bilingual",
  "chatTranslation",
] as const;

export type FaqItemKey = (typeof FAQ_CATEGORIES)[number]["items"][number];
