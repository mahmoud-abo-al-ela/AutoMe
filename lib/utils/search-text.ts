const char = (code: number) => String.fromCodePoint(code);
const range = (from: number, to: number) => `${char(from)}-${char(to)}`;
const classOf = (...parts: string[]) => new RegExp(`[${parts.join("")}]`, "g");

const LETTER_FOLD: Record<string, string> = {
  [char(0x0623)]: char(0x0627), // أ alef with hamza above -> ا
  [char(0x0625)]: char(0x0627), // إ alef with hamza below -> ا
  [char(0x0622)]: char(0x0627), // آ alef with madda       -> ا
  [char(0x0671)]: char(0x0627), // ٱ alef wasla            -> ا
  [char(0x0629)]: char(0x0647), // ة ta marbuta            -> ه
  [char(0x0649)]: char(0x064a), // ى alef maqsura          -> ي
};

/** Arabic-Indic (٠-٩) and extended Arabic-Indic (۰-۹) digits, folded to ASCII. */
const DIGIT_FOLD: Record<string, string> = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [
    [char(0x0660 + i), String(i)],
    [char(0x06f0 + i), String(i)],
  ]).flat()
);

const CHARACTER_FOLD: Record<string, string> = { ...LETTER_FOLD, ...DIGIT_FOLD };

const FOLDABLE = classOf(...Object.keys(CHARACTER_FOLD));

const REMOVED_MARKS = classOf(
  range(0x064b, 0x0655), // tashkeel and the combining hamzas
  char(0x0670), //          superscript (dagger) alef
  char(0x0640) //           tatweel
);

export function foldSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(REMOVED_MARKS, "")
    .replace(FOLDABLE, (character) => CHARACTER_FOLD[character]);
}

export const ARABIC_LETTERS = `${range(0x0621, 0x063a)}${range(0x0641, 0x064a)}${range(0x066e, 0x06d3)}${range(0x06fa, 0x06ff)}`;

/** Latin combining marks, which `foldSearchText` deliberately leaves alone. */
const LATIN_MARKS = classOf(range(0x0300, 0x036f));

const WORD = new RegExp(`[a-z0-9]+|[${ARABIC_LETTERS}]+`, "g");

export function searchWords(value: string): string[] {
  return (
    foldSearchText(value).normalize("NFD").replace(LATIN_MARKS, "").match(WORD) ??
    []
  );
}

const ARABIC_LETTER = new RegExp(`^[${ARABIC_LETTERS}]$`);

export function searchCharKind(character: string): "latin" | "arabic" | null {
  if (/^[a-z0-9]$/.test(character)) return "latin";
  return ARABIC_LETTER.test(character) ? "arabic" : null;
}

export function foldSearchCharacter(character: string): string {
  return foldSearchText(character).normalize("NFD").replace(LATIN_MARKS, "");
}
