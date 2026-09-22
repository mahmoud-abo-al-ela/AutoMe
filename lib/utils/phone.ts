/**
 * Egyptian phone numbers for AutoMe.
 *
 * The product serves one country, so a dealer types the number the way they
 * would write it down — "01001234567". What they *paste*, though, is whatever
 * their contacts app gave them: "+20 100 123 4567", "0020 100…", "٠١٠٠…",
 * sometimes with the country code twice.
 *
 * Internally everything reduces to the *national significant number*: what
 * remains after the country code and the domestic trunk "0". That is the form
 * the validation rule is written against. `toLocalEgyptPhone` puts the trunk
 * "0" back, and that local form is what the form field holds and what gets
 * stored — one shape, the one Egyptians read.
 */

/** Egypt's country calling code, without the plus. */
export const EGYPT_DIALING_CODE = "20";

/** The domestic trunk prefix every Egyptian number is written with. */
const TRUNK_PREFIX = "0";

/**
 * Shortest national number worth peeling down to: the shorter governorate
 * landlines. The upper bound — 10, for a mobile — lives in the pattern below,
 * deliberately as a *validation* rule rather than a truncation: silently
 * dropping the digits past the tenth would accept a number the dealer never
 * typed.
 */
const MIN_NATIONAL_LENGTH = 8;

/**
 * A national number: no leading zero (that is the trunk prefix, stripped
 * above) and no country code.
 */
const NATIONAL_PATTERN = /^[1-9]\d{7,9}$/;

/**
 * Length bounds of the *local* form — the one the field holds and the reader
 * sees. Nine is the trunk "0" plus the shortest governorate landline, eleven
 * is the trunk "0" plus a mobile.
 *
 * A test pins these against NATIONAL_PATTERN, because they are quoted in the
 * error message and nothing else would notice them drifting apart.
 */
export const LOCAL_MIN_LENGTH = 9;
export const LOCAL_MAX_LENGTH = 11;

/**
 * Arabic-Indic (٠١٢) and Extended Arabic-Indic (۰۱۲) digits.
 *
 * The Arabic UI renders numerals in the first of those, so a dealer reading an
 * Arabic page has every reason to type them back. Without this they are simply
 * dropped by the digit filter and the number silently loses characters.
 */
const EASTERN_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/g;

/**
 * Rewrite Eastern digits as Western ones, leaving everything else untouched.
 *
 * Exported because the phone field applies it to what is on screen as well as
 * to what is stored: a phone number is dialled, pasted and read back against
 * contact lists, so it stays in Western digits even on an Arabic page where
 * every other number is Eastern. The mapping is one character for one, so
 * rewriting the input in place does not move the caret.
 */
export function toLatinDigits(value: string): string {
  return value.replace(EASTERN_DIGITS, (digit) => {
    const code = digit.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
}

/**
 * Remove one layer of "this is Egypt" from the front of a digit string: the
 * domestic trunk zero, the international access "00", and the country code.
 *
 * Returns the input unchanged when there is nothing left to peel, which is how
 * the caller knows to stop.
 */
function peelPrefix(digits: string): string {
  const withoutTrunk = digits.replace(/^0+/, "");

  if (!withoutTrunk.startsWith(EGYPT_DIALING_CODE)) return withoutTrunk;

  const withoutCode = withoutTrunk.slice(EGYPT_DIALING_CODE.length).replace(/^0+/, "");

  // A Cairo landline legitimately begins with 2, so "20…" is only read as the
  // country code when what follows is still long enough to be a number in its
  // own right. Halfway through typing one, it is not.
  return withoutCode.length >= MIN_NATIONAL_LENGTH ? withoutCode : withoutTrunk;
}

/**
 * The national number behind whatever the dealer typed.
 *
 * Peels twice, not once: pasting a full international number into a field that
 * already shows "+20" is the ordinary way to end up with the code repeated,
 * and "+20+20…" should mean the same number rather than an error the reader
 * has to decode.
 */
export function toNationalEgyptPhone(input: string): string {
  let digits = toPhoneDigits(input);

  for (let pass = 0; pass < 2; pass += 1) {
    const peeled = peelPrefix(digits);
    if (peeled === digits) break;
    digits = peeled;
  }

  return digits;
}

/**
 * Just the digits, in Western form: everything the phone field accepts.
 *
 * Separators are dropped rather than preserved because they are decoration —
 * dealers type "010 123", "010-123" and "(010)123" for the same number, and a
 * field that keeps whichever they chose makes two identical numbers look
 * different in the database.
 */
export function toPhoneDigits(value: string): string {
  return toLatinDigits(value ?? "").replace(/[^0-9]/g, "");
}

/**
 * What the phone field shows: digits only, and never longer than an Egyptian
 * number gets.
 *
 * Over the cap it peels first rather than cutting: a pasted "+20 100 123 4567"
 * is twelve digits, and truncating it would leave a mangled number where
 * dropping the country code leaves the right one. Only when peeling does not
 * bring it under the cap is the tail cut — which is what any `maxLength` would
 * have done to the paste as well, and the reason there is no `maxLength` on
 * the input itself.
 */
export function toPhoneField(value: string): string {
  const digits = toPhoneDigits(value);
  if (digits.length <= LOCAL_MAX_LENGTH) return digits;

  const local = toLocalEgyptPhone(digits);
  return local.length <= LOCAL_MAX_LENGTH
    ? local
    : digits.slice(0, LOCAL_MAX_LENGTH);
}

/** Whether a national number is one Egypt could actually route. */
export function isEgyptNationalPhone(value: string): boolean {
  return NATIONAL_PATTERN.test(value);
}

/**
 * The canonical local form: the trunk "0" followed by the national number.
 *
 * This is what the field holds and what is stored, so a number survives a trip
 * out to the database and back into the form unchanged. Empty in, empty out —
 * an untouched optional field must not become the string "0".
 */
export function toLocalEgyptPhone(input: string): string {
  const digits = toNationalEgyptPhone(input);
  return digits ? `${TRUNK_PREFIX}${digits}` : "";
}

/**
 * Whether the reader has typed something Egypt could route, in whatever shape
 * they typed it. The form value is the local form, so this peels before it
 * checks rather than demanding one particular spelling.
 */
export function isEgyptPhone(value: string): boolean {
  return isEgyptNationalPhone(toNationalEgyptPhone(value));
}
