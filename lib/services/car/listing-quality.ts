/**
 * The deterministic half of the listing-quality coach.
 *
 * These rules decide WHAT is weak; the model only writes advice for what they
 * flagged (see coachListing). So the score is reproducible, costs nothing, and
 * still works on a plan without AI or when the provider is down — the coach
 * degrades to its rule-based half rather than disappearing.
 *
 * Deliberately few rules, each one something a buyer demonstrably notices. A
 * coach that nags about everything is ignored about everything.
 */

export type IssueSeverity = "high" | "medium" | "low";

export const LISTING_ISSUE_CODES = [
  "fewPhotos",
  "morePhotos",
  "shortDescription",
  "briefDescription",
  "noFeatures",
  "fewFeatures",
  "zeroMileage",
] as const;

export type ListingIssueCode = (typeof LISTING_ISSUE_CODES)[number];

export interface ListingIssue {
  code: ListingIssueCode;
  /** The form field the dealer should go to. */
  field: "images" | "description" | "features" | "mileage";
  severity: IssueSeverity;
}

/** What the rules read: the listing as the dealer currently sees it. */
export interface ListingForReview {
  year: number;
  mileage: number;
  /** The description in the dashboard's language — the one on screen. */
  description: string;
  features: string[];
  imageCount: number;
}

export interface ListingReview {
  /** 0–100. 100 means no rule flagged anything. */
  score: number;
  issues: ListingIssue[];
}

/** Listings with fewer photos than this get noticeably fewer enquiries. */
export const MIN_PHOTOS = 3;
export const GOOD_PHOTOS = 6;
/** Roughly one sentence, and roughly three. */
const MIN_DESCRIPTION = 80;
const GOOD_DESCRIPTION = 200;
const GOOD_FEATURES = 3;

const PENALTY: Record<IssueSeverity, number> = { high: 25, medium: 10, low: 5 };

export function reviewListing(
  listing: ListingForReview,
  now: Date = new Date()
): ListingReview {
  const issues: ListingIssue[] = [];

  if (listing.imageCount < MIN_PHOTOS) {
    issues.push({ code: "fewPhotos", field: "images", severity: "high" });
  } else if (listing.imageCount < GOOD_PHOTOS) {
    issues.push({ code: "morePhotos", field: "images", severity: "medium" });
  }

  const description = listing.description.trim().length;
  if (description < MIN_DESCRIPTION) {
    issues.push({ code: "shortDescription", field: "description", severity: "high" });
  } else if (description < GOOD_DESCRIPTION) {
    issues.push({ code: "briefDescription", field: "description", severity: "medium" });
  }

  const features = listing.features.filter((f) => f.trim()).length;
  if (features === 0) {
    issues.push({ code: "noFeatures", field: "features", severity: "high" });
  } else if (features < GOOD_FEATURES) {
    issues.push({ code: "fewFeatures", field: "features", severity: "low" });
  }

  // 0 km on a car more than a year old reads as "not filled in", not as new.
  if (listing.mileage === 0 && listing.year < now.getFullYear() - 1) {
    issues.push({ code: "zeroMileage", field: "mileage", severity: "medium" });
  }

  const score = Math.max(
    0,
    100 - issues.reduce((sum, issue) => sum + PENALTY[issue.severity], 0)
  );
  return { score, issues };
}
