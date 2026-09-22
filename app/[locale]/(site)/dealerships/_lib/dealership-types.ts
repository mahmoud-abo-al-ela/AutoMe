import type { useDealershipsPage } from "@/hooks/use-dealerships-page";
import type { getDealershipReviews } from "@/actions/dealerships";
import type { ActionResponse } from "@/lib/utils/response";

/** Everything `useDealershipsPage` returns; ClientPage spreads it into the presenter. */
export type DealershipsPageData = ReturnType<typeof useDealershipsPage>;

/** One dealership row as the listing renders it. */
export type DealershipListItem = DealershipsPageData["dealerships"][number];

export type DealershipFilters = DealershipsPageData["filters"];
export type DealershipFilterOptions = DealershipsPageData["filterOptions"];
export type DealershipActiveFilter = DealershipsPageData["activeFilters"][number];
export type DealershipPagination = DealershipsPageData["pagination"];
export type DealershipHandlers = DealershipsPageData["handlers"];

/** The success payload of `getDealershipReviews`, unwrapped from the envelope. */
type ReviewsResponse = Awaited<ReturnType<typeof getDealershipReviews>>;
type ReviewsData =
  ReviewsResponse extends ActionResponse<infer T> ? T : never;

export type DealershipReview = ReviewsData["reviews"][number];
export type ReviewsPagination = ReviewsData["pagination"];
