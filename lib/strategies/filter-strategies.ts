// Filter chip clear/label strategies for the cars page. Kept structural — the
// concrete filter shape lives with the page hook (hooks/cars-page-filters).
type FilterBag = Record<string, unknown>;

type FilterStrategy = {
    clear: (filters: FilterBag) => FilterBag;
    getLabel: (value: unknown) => string;
};

export const filterStrategies: Record<string, FilterStrategy> = {
    search: {
        clear: (filters: FilterBag) => ({ ...filters, search: undefined }),
        getLabel: (value: unknown) => `Search: ${value}`,
    },
    make: {
        clear: (filters: FilterBag) => ({ ...filters, make: undefined }),
        getLabel: (value: unknown) => `Make: ${value}`,
    },
    bodyType: {
        clear: (filters: FilterBag) => ({ ...filters, bodyType: undefined }),
        getLabel: (value: unknown) => `Body: ${value}`,
    },
    fuelType: {
        clear: (filters: FilterBag) => ({ ...filters, fuelType: undefined }),
        getLabel: (value: unknown) => `Fuel: ${value}`,
    },
    transmission: {
        clear: (filters: FilterBag) => ({ ...filters, transmission: undefined }),
        getLabel: (value: unknown) => `Trans: ${value}`,
    },
    dealership: {
        clear: (filters: FilterBag) => ({ ...filters, dealership: undefined }),
        getLabel: (value: unknown) => `Dealer: ${value}`,
    },
    city: {
        clear: (filters: FilterBag) => ({ ...filters, city: undefined }),
        getLabel: (value: unknown) => `City: ${value}`,
    },
    price: {
        clear: (filters: FilterBag) => ({
            ...filters,
            minPrice: undefined,
            maxPrice: undefined
        }),
        getLabel: (value: unknown) => `Price: ${value}`,
    },
    sort: {
        clear: (filters: FilterBag) => ({ ...filters, sortBy: "newest" }),
        getLabel: (value: unknown) => `Sort: ${value}`,
    },
};

export const getFilterLabel = (type: string, value: unknown) => {
    const strategy = filterStrategies[type];
    return strategy ? strategy.getLabel(value) : value;
};

export const clearFilterByType = (filters: FilterBag, type: string) => {
    const strategy = filterStrategies[type];
    return strategy ? strategy.clear(filters) : filters;
};
