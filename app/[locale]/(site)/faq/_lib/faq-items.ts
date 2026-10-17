export const FAQ_CATEGORIES = [
  {
    key: "buying",
    items: ["findCar", "freeForBuyers", "compare", "testDrive", "inspection", "payment", "sellCar"],
  },
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
