// Per-capability model + generation config. One place to swap a model or tune
// params. Model ids are env-overridable because Google no longer publishes
// free-tier eligibility per model — switching is a redeploy, not a code change.

/**
 * @typedef {"searchFilters" | "carListing"} Capability
 */

export const MODELS = {
    // Text -> structured filters. Lowest-latency free-tier model; thinking is off
    // by default on flash-lite. temperature 0 makes identical queries yield
    // identical filters, which also keeps the response cache honest.
    searchFilters: {
        model: process.env.GEMINI_MODEL_SEARCH || "gemini-2.5-flash-lite",
        generationConfig: {
            temperature: 0,
            maxOutputTokens: 1024,
        },
    },

    // Image -> listing. Stronger multimodal model. Thinking is ON by default on
    // 2.5 Flash and would eat the token budget for a pure extraction task, so it
    // is disabled explicitly (thinkingBudget: 0).
    carListing: {
        model: process.env.GEMINI_MODEL_VISION || "gemini-2.5-flash",
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            thinkingConfig: { thinkingBudget: 0 },
        },
    },
};
