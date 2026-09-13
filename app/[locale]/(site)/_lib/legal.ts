/**
 * When the legal documents were last substantively revised.
 *
 * This was `new Date()` at each of the three call sites, which rendered
 * whatever day the page happened to be viewed — so the policies claimed to have
 * been revised today, every day, and the date came out in the *server's* locale
 * rather than the reader's. A last-updated date on a policy is a factual claim;
 * it has to be a date someone chose.
 *
 * Update this when the wording of terms, privacy or cookies actually changes.
 * 2026-09-13 is the day the Arabic translations and the governing-language
 * clause were added.
 */
export const LEGAL_LAST_UPDATED = "2026-09-13";
