/**
 * Dealership slugs: the subdomain a dealership is served at
 * (`nile-motors.autome.com`), so ASCII by necessity.
 *
 * Arabic names are not transliterated. Arabic is written without short
 * vowels, so a character map turns "معرض النيل" into something like
 * "marad-alnyl" — an address the dealer could not guess or spell over the
 * phone. Instead the slug is suggested from whatever Latin letters the name
 * has, and typed by the dealer when it has none. Egyptian dealerships almost
 * always have a Latin form of their name already.
 *
 * The rules live here once, for onboarding, super-admin and the server.
 */

export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 50;

/** Lowercase letters and digits, single hyphens between them. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Whether `slug` is a complete, valid slug. */
export function isValidSlug(slug: string): boolean {
  return (
    slug.length >= SLUG_MIN_LENGTH &&
    slug.length <= SLUG_MAX_LENGTH &&
    SLUG_PATTERN.test(slug)
  );
}

/**
 * Clean up what someone is typing into a slug field, keystroke by keystroke:
 * lowercase, spaces and underscores to hyphens, everything else outside
 * `a-z0-9-` dropped, no doubled hyphens, no leading hyphen.
 *
 * A trailing hyphen is kept, or typing "nile-" on the way to "nile-motors"
 * would be undone at the hyphen. `slugFromName` and the final check trim it.
 */
export function normalizeSlugInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-/, "")
    .slice(0, SLUG_MAX_LENGTH);
}

/**
 * The slug suggested for a dealership name, from its Latin letters and digits
 * only. "" when the name has none — an all-Arabic name — which the forms
 * treat as "ask for one" rather than inventing an address.
 */
export function slugFromName(name: string): string {
  return normalizeSlugInput(
    name
      // Accented Latin letters keep their base letter (é → e).
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      // Anything that is not a Latin letter or digit separates words.
      .replace(/[^A-Za-z0-9]+/g, " ")
      .trim()
  ).replace(/-$/, "");
}
