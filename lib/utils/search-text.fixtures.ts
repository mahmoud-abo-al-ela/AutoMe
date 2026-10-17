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
