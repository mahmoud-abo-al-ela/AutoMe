// Validation rules and constraints

export const VALIDATION_RULES = {
    CAR: {
        YEAR_MIN: 1900,
        YEAR_MAX: new Date().getFullYear(),
        PRICE_MIN: 1,
        MILEAGE_MIN: 0,
        SEATS_MIN: 1,
        SEATS_MAX: 12,
        DESCRIPTION_MIN_LENGTH: 10,
        DESCRIPTION_MAX_LENGTH: 2000,
        TITLE_MIN_LENGTH: 1,
        TITLE_MAX_LENGTH: 100,
        MAX_IMAGES: 5,
        MIN_IMAGES: 1,
        MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
        MAX_FEATURES: 20,
    },
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 9,
        MAX_LIMIT: 100,
    },
    SEARCH: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 100,
    },
};

export const ERROR_MESSAGES = {
    CAR: {
        TITLE_REQUIRED: "Title is required",
        MAKE_REQUIRED: "Make is required",
        MODEL_REQUIRED: "Model is required",
        YEAR_INVALID: `Year must be between ${VALIDATION_RULES.CAR.YEAR_MIN} and ${VALIDATION_RULES.CAR.YEAR_MAX}`,
        PRICE_INVALID: "Price must be greater than 0",
        MILEAGE_INVALID: "Mileage must be 0 or greater",
        BODY_TYPE_REQUIRED: "Body type is required",
        FUEL_TYPE_REQUIRED: "Fuel type is required",
        TRANSMISSION_REQUIRED: "Transmission is required",
        COLOR_REQUIRED: "Color is required",
        SEATS_INVALID: `Seats must be between ${VALIDATION_RULES.CAR.SEATS_MIN} and ${VALIDATION_RULES.CAR.SEATS_MAX}`,
        LOCATION_REQUIRED: "Location is required",
        DESCRIPTION_TOO_SHORT: `Description must be at least ${VALIDATION_RULES.CAR.DESCRIPTION_MIN_LENGTH} characters`,
        IMAGES_REQUIRED: `At least ${VALIDATION_RULES.CAR.MIN_IMAGES} image is required`,
        IMAGES_TOO_MANY: `Maximum of ${VALIDATION_RULES.CAR.MAX_IMAGES} images allowed`,
        IMAGE_TOO_LARGE: `Image size must not exceed ${VALIDATION_RULES.CAR.MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
        IMAGE_INVALID_TYPE: "Invalid image type. Only JPEG, PNG, and WEBP are allowed",
    },
    AUTH: {
        UNAUTHORIZED: "User not authenticated",
        USER_NOT_FOUND: "User not found",
    },
    GENERAL: {
        NOT_FOUND: "Resource not found",
        INTERNAL_ERROR: "An internal error occurred",
        INVALID_INPUT: "Invalid input provided",
    },
};
