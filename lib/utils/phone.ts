/** Egypt's country calling code, without the plus. */
export const EGYPT_DIALING_CODE = "20";

/** The domestic trunk prefix every Egyptian number is written with. */
const TRUNK_PREFIX = "0";

const MIN_NATIONAL_LENGTH = 8;

/**
 * A national number: no leading zero (that is the trunk prefix, stripped
 * above) and no country code.
 */
const NATIONAL_PATTERN = /^[1-9]\d{7,9}$/;

export const LOCAL_MIN_LENGTH = 9;
export const LOCAL_MAX_LENGTH = 11;

const EASTERN_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/g;

export function toLatinDigits(value: string): string {
  return value.replace(EASTERN_DIGITS, (digit) => {
    const code = digit.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
}

function peelPrefix(digits: string): string {
  const withoutTrunk = digits.replace(/^0+/, "");

  if (!withoutTrunk.startsWith(EGYPT_DIALING_CODE)) return withoutTrunk;

  const withoutCode = withoutTrunk.slice(EGYPT_DIALING_CODE.length).replace(/^0+/, "");

  // A Cairo landline legitimately begins with 2, so "20…" is only read as the
  // country code when what follows is still long enough to be a number in its
  // own right. Halfway through typing one, it is not.
  return withoutCode.length >= MIN_NATIONAL_LENGTH ? withoutCode : withoutTrunk;
}

export function toNationalEgyptPhone(input: string): string {
  let digits = toPhoneDigits(input);

  for (let pass = 0; pass < 2; pass += 1) {
    const peeled = peelPrefix(digits);
    if (peeled === digits) break;
    digits = peeled;
  }

  return digits;
}

export function toPhoneDigits(value: string): string {
  return toLatinDigits(value ?? "").replace(/[^0-9]/g, "");
}

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

export function toLocalEgyptPhone(input: string): string {
  const digits = toNationalEgyptPhone(input);
  return digits ? `${TRUNK_PREFIX}${digits}` : "";
}

export function isEgyptPhone(value: string): boolean {
  return isEgyptNationalPhone(toNationalEgyptPhone(value));
}

/**
 * An Egyptian mobile's national number: 10, 11, 12 or 15, then eight digits.
 * Only these can be on WhatsApp; a landline cannot.
 */
const MOBILE_NATIONAL_PATTERN = /^1[0125]\d{8}$/;

/** A `tel:` link in international form, or null for a number Egypt cannot route. */
export function telHref(phone: string | null | undefined): string | null {
  const national = toNationalEgyptPhone(phone ?? "");
  return isEgyptNationalPhone(national) ? `tel:+${EGYPT_DIALING_CODE}${national}` : null;
}

export function whatsappHref(phone: string | null | undefined, text?: string): string | null {
  const national = toNationalEgyptPhone(phone ?? "");
  if (!MOBILE_NATIONAL_PATTERN.test(national)) return null;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${EGYPT_DIALING_CODE}${national}${query}`;
}
