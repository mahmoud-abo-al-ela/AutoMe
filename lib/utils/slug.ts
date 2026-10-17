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

export function normalizeSlugInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-/, "")
    .slice(0, SLUG_MAX_LENGTH);
}

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
