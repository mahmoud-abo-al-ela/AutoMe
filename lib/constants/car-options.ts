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

export const DEFAULT_PER_PAGE = 12;

export const SORT_OPTIONS = {
    NEWEST: "newest",
    PRICE_ASC: "priceAsc",
    PRICE_DESC: "priceDesc",
    YEAR_DESC: "yearDesc",
    YEAR_ASC: "yearAsc",
    MILEAGE_ASC: "mileageAsc",
};

export const SORT_LABELS = {
    [SORT_OPTIONS.NEWEST]: "Newest First",
    [SORT_OPTIONS.PRICE_ASC]: "Price: Low to High",
    [SORT_OPTIONS.PRICE_DESC]: "Price: High to Low",
    [SORT_OPTIONS.YEAR_DESC]: "Year: Newest",
    [SORT_OPTIONS.YEAR_ASC]: "Year: Oldest",
    [SORT_OPTIONS.MILEAGE_ASC]: "Mileage: Lowest",
};

// Maps human colour names to CSS hex so the card swatch renders correctly.
// "Metallic Grey".toLowerCase().replace(/\s+/g,"") would otherwise be an
// invalid CSS colour and render transparent.
export const CAR_COLOR_HEX = {
    black: "#111827",
    white: "#f8fafc",
    silver: "#c0c0c0",
    grey: "#6b7280",
    gray: "#6b7280",
    "metallic grey": "#8a8d91",
    "metallic gray": "#8a8d91",
    red: "#dc2626",
    blue: "#2563eb",
    "navy blue": "#1e3a8a",
    navy: "#1e3a8a",
    green: "#16a34a",
    yellow: "#eab308",
    orange: "#ea580c",
    brown: "#78350f",
    beige: "#e3dac9",
    gold: "#d4af37",
    bronze: "#cd7f32",
    purple: "#7c3aed",
    maroon: "#7f1d1d",
};

/**
 * Resolve a car colour name to a hex value for the swatch. Falls back to a
 * neutral slate when the colour is unknown.
 */
export const getCarColorHex = (color?: string | null): string => {
    if (!color) return "#94a3b8";
    const key = color.toLowerCase().trim() as keyof typeof CAR_COLOR_HEX;
    return CAR_COLOR_HEX[key] || "#94a3b8";
};
