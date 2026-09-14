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
