// Car configuration constants

export const CAR_STATUS = {
    AVAILABLE: "AVAILABLE",
    SOLD: "SOLD",
    UNAVAILABLE: "UNAVAILABLE",
};

export const STATUS_LABELS = {
    [CAR_STATUS.AVAILABLE]: "Available",
    [CAR_STATUS.SOLD]: "Sold",
    [CAR_STATUS.UNAVAILABLE]: "Unavailable",
};

export const STATUS_FORM_TO_DB = {
    Available: CAR_STATUS.AVAILABLE,
    Sold: CAR_STATUS.SOLD,
    Unavailable: CAR_STATUS.UNAVAILABLE,
};

export const STATUS_DB_TO_FORM = {
    [CAR_STATUS.AVAILABLE]: "Available",
    [CAR_STATUS.SOLD]: "Sold",
    [CAR_STATUS.UNAVAILABLE]: "Unavailable",
};

export const BODY_TYPES = [
    "SUV",
    "Sedan",
    "Hatchback",
    "Convertible",
    "Coupe",
    "Wagon",
    "Pickup",
    "Pickup Truck",
];

export const FUEL_TYPES = [
    "Gasoline",
    "Diesel",
    "Electric",
    "Hybrid",
    "Plug-in Hybrid",
];

export const TRANSMISSIONS = [
    "Automatic",
    "Manual",
    "Semi-Automatic",
];

export const SORT_OPTIONS = {
    NEWEST: "newest",
    PRICE_ASC: "priceAsc",
    PRICE_DESC: "priceDesc",
};

export const SORT_LABELS = {
    [SORT_OPTIONS.NEWEST]: "Newest First",
    [SORT_OPTIONS.PRICE_ASC]: "Price: Low to High",
    [SORT_OPTIONS.PRICE_DESC]: "Price: High to Low",
};
