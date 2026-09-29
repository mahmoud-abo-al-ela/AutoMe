import { foldSearchText } from "@/lib/utils/search-text";

/**
 * The first, free pass of chat moderation: which messages are worth asking
 * the model about at all.
 *
 * Deliberately broad and never the judge. A signal here only routes a message
 * to the model (lib/services/chat/moderation); on its own it flags nothing,
 * because most of these words are ordinary car talk — "مقدم" is a down
 * payment, a dealer sends its WhatsApp number, a buyer says "stupid me".
 * A message with no signal is left alone and costs nothing, which is what
 * keeps moderating every message affordable.
 *
 * Arabic terms are folded the same way the text is (أ/إ/آ → ا, ة → ه,
 * ى → ي, Arabic-Indic digits → Western), so either spelling matches; they
 * match inside words too, since Arabic attaches و/ف/ب/ال to them.
 */
export type ScreenSignal =
  | "link"
  | "payment"
  | "prize"
  | "credentials"
  | "abuse"
  | "threat"
  | "flood";

const fold = (terms: string[]) => terms.map(foldSearchText);

const ARABIC: Record<Exclude<ScreenSignal, "link" | "flood">, string[]> = {
  payment: fold([
    "حول", "حوّل", "تحويل", "ابعت فلوس", "ابعتلي فلوس", "ادفع", "عربون", "مقدم حجز",
    "فودافون كاش", "اورنج كاش", "اتصالات كاش", "انستاباي", "انستا باي", "محفظه", "فوري",
    "بيتكوين", "كريبتو", "عمله رقميه", "ويسترن يونيون",
  ]),
  prize: fold(["كسبت", "جايزه", "جائزه", "مبروك فزت", "فزت ب", "سحب علي"]),
  credentials: fold([
    "كود التفعيل", "كود التحقق", "رمز التحقق", "الباسورد", "كلمه السر", "رقم الكارت",
    "رقم البطاقه", "الرقم السري",
  ]),
  abuse: fold([
    "يا حمار", "حيوان", "غبي", "يا كلب", "ابن الكلب", "وسخ", "زباله", "خول", "متناك",
    "شرموط", "عرص", "يلعن", "كس ام", "منيوك", "حقير", "نصاب",
  ]),
  threat: fold(["هقتلك", "هموتك", "هاذيك", "هأذيك", "هجيلك", "هتندم", "هفضحك"]),
};

const ENGLISH: Record<Exclude<ScreenSignal, "link" | "flood">, RegExp> = {
  payment:
    /\b(transfer|wire|deposit|advance payment|pay (first|now|upfront|before)|western union|moneygram|bitcoin|crypto|usdt|gift ?card|instapay|vodafone cash|wallet)\b/,
  prize: /\b(you (have )?won|winner|prize|lottery|congratulations,? you)\b/,
  credentials: /\b(password|otp|verification code|card number|cvv|pin code)\b/,
  abuse: /\b(fuck\w*|shit\w*|bitch\w*|asshole|bastard|idiot|stupid|moron|dick|scammer|thief)\b/,
  threat: /\b(kill you|hurt you|i will find you|you will regret)\b/,
};

/** A URL, or a bare domain on a common or cheap TLD. */
const LINK = /\bhttps?:\/\/|\bwww\.|\b[a-z0-9-]+\.(com|net|org|info|xyz|io|me|link|ly|click|top|site|online|shop)\b/;
/** A character typed seven times running, or a very long message. */
const FLOOD = /(.)\1{6,}/u;
const FLOOD_LENGTH = 1500;

/** The signals in a message; empty means leave it alone. */
export function screenChatMessage(text: string): ScreenSignal[] {
  const folded = foldSearchText(text);
  const signals = new Set<ScreenSignal>();

  if (LINK.test(folded)) signals.add("link");
  if (FLOOD.test(folded) || folded.length > FLOOD_LENGTH) signals.add("flood");
  for (const signal of Object.keys(ARABIC) as (keyof typeof ARABIC)[]) {
    if (ENGLISH[signal].test(folded) || ARABIC[signal].some((term) => folded.includes(term))) {
      signals.add(signal);
    }
  }
  return [...signals];
}
