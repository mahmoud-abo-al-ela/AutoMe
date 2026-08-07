// Dealership listing sort options — a single flat enum shared by the UI, the
// service and the repository. Replaces the old sortBy + sortOrder pair, which
// the toolbar cross-producted into 8 nonsensical asc/desc permutations.

export const DEALERSHIP_SORT_OPTIONS = {
    RATING: "rating",
    MOST_CARS: "mostCars",
    MOST_REVIEWED: "mostReviewed",
    NEWEST: "newest",
    NAME_ASC: "nameAsc",
};

export const DEALERSHIP_SORT_LABELS = {
    [DEALERSHIP_SORT_OPTIONS.RATING]: "Highest Rated",
    [DEALERSHIP_SORT_OPTIONS.MOST_CARS]: "Most Cars",
    [DEALERSHIP_SORT_OPTIONS.MOST_REVIEWED]: "Most Reviewed",
    [DEALERSHIP_SORT_OPTIONS.NEWEST]: "Newest",
    [DEALERSHIP_SORT_OPTIONS.NAME_ASC]: "Name (A–Z)",
};

// Order the options appear in the sort dropdown.
export const DEALERSHIP_SORT_ORDER = [
    DEALERSHIP_SORT_OPTIONS.RATING,
    DEALERSHIP_SORT_OPTIONS.MOST_CARS,
    DEALERSHIP_SORT_OPTIONS.MOST_REVIEWED,
    DEALERSHIP_SORT_OPTIONS.NEWEST,
    DEALERSHIP_SORT_OPTIONS.NAME_ASC,
];

export const DEFAULT_DEALERSHIP_SORT = DEALERSHIP_SORT_OPTIONS.RATING;

export const DEFAULT_DEALERSHIP_PER_PAGE = 12;
export const DEALERSHIP_PER_PAGE_OPTIONS = [12, 24, 48];

// Rating quick-filter tiers (minimum average rating).
export const DEALERSHIP_RATING_TIERS = [
    { label: "5 Stars", value: 5 },
    { label: "4+ Stars", value: 4 },
    { label: "3+ Stars", value: 3 },
    { label: "2+ Stars", value: 2 },
    { label: "1+ Stars", value: 1 },
];
