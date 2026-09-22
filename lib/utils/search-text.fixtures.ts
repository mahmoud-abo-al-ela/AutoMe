/**
 * The contract between the two halves of the search fold.
 *
 * `foldSearchText` (TypeScript, the query side) and `fold_search_text` (SQL,
 * the stored `Car.searchVector`) have to agree character for character. They
 * are written in different languages against different string APIs, so the
 * only way to know they still agree is to run the same inputs through both:
 * `lib/utils/search-text.test.ts` covers the TypeScript side on every run, and
 * `test/search.test.ts` feeds this same list to Postgres when a test database
 * is configured.
 *
 * Add a case here whenever the fold changes, not to one of the two tests.
 */
export const FOLD_FIXTURES = [
  // The forms that fold.
  "أحمد",
  "إسكندرية",
  "الآن",
  "ٱلقاهرة",
  "سيارة",
  "مصطفى",
  "مسؤول",
  "مسئول",
  // Marks that vanish.
  "سَيَّارَة",
  "سيــارة",
  "اللّٰه",
  // Digits that become ASCII.
  "٢٠٢٠",
  "۲۰۲۰",
  "موديل ٢٠٢٠ بسعر ٥٠٠٠٠٠",
  // Mixed scripts and case, which is what a real listing looks like.
  "Toyota Corolla ٢٠٢٠ فابريكا بالكامل",
  "BMW X5 الجيزة",
  // Things that must survive untouched.
  "corolla",
  "X5",
  "2020",
  "",
  " ",
  // Punctuation from both scripts.
  "سيارة، جميلة؟ نعم؛ جدا",
  "ab' | cd & ef:* ! (gh)",
] as const;
