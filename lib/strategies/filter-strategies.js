export const filterStrategies = {
    search: {
        clear: (filters) => ({ ...filters, search: undefined }),
        getLabel: (value) => `Search: ${value}`,
    },
    make: {
        clear: (filters) => ({ ...filters, make: undefined }),
        getLabel: (value) => `Make: ${value}`,
    },
    bodyType: {
        clear: (filters) => ({ ...filters, bodyType: undefined }),
        getLabel: (value) => `Body: ${value}`,
    },
    fuelType: {
        clear: (filters) => ({ ...filters, fuelType: undefined }),
        getLabel: (value) => `Fuel: ${value}`,
    },
    transmission: {
        clear: (filters) => ({ ...filters, transmission: undefined }),
        getLabel: (value) => `Trans: ${value}`,
    },
    price: {
        clear: (filters) => ({
            ...filters,
            minPrice: undefined,
            maxPrice: undefined
        }),
        getLabel: (value) => `Price: ${value}`,
    },
    sort: {
        clear: (filters) => ({ ...filters, sortBy: "newest" }),
        getLabel: (value) => `Sort: ${value}`,
    },
};

export const getFilterLabel = (type, value) => {
    const strategy = filterStrategies[type];
    return strategy ? strategy.getLabel(value) : value;
};

export const clearFilterByType = (filters, type) => {
    const strategy = filterStrategies[type];
    return strategy ? strategy.clear(filters) : filters;
};
