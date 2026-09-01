import { arSA, enUS } from "@clerk/localizations";
import type { Locale } from "@/i18n/routing";

/**
 * Locale for the UI Clerk renders itself.
 *
 * `<SignIn>`, `<SignUp>` and the `<UserButton>` dropdown and account modal are
 * drawn from bundles Clerk ships, not from `messages/`. next-intl cannot reach
 * inside them, so the active locale has to be handed to `ClerkProvider`
 * separately — otherwise every auth screen stays English on `/ar` no matter how
 * much of the rest of the site is translated.
 *
 * `arSA` is the only Arabic bundle Clerk publishes; there is no `ar-EG`. The
 * copy is Modern Standard Arabic, which is what an Egyptian reader expects from
 * UI chrome, so the regional tag makes no practical difference.
 */

type LocalizationResource = typeof enUS;

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * Corrections to Clerk's `arSA` bundle.
 *
 * Each of these is a spelling or word-choice error rather than a dialect
 * preference, and in two cases the bundle already contradicts itself elsewhere.
 * Keep this list short: it is a patch over an upstream package, so every entry
 * is something to re-check when `@clerk/localizations` is upgraded.
 */
const arabicCorrections: DeepPartial<LocalizationResource> = {
  signUp: {
    start: {
      // Ships as "أنشاء" — hamza written above the alef. The verbal noun is
      // إنشاء, and this same bundle spells it correctly in
      // signIn.start.actionLink, so it is a typo, not a variant.
      title: "إنشاء حساب جديد",
    },
  },
  signIn: {
    password: {
      // "ادخل" is form I, "enter [a place]". Entering a value is form IV, أدخل.
      title: "أدخل كلمة المرور",
    },
  },
  // Ships as "العنوان الإلكتروني", literally "electronic address". Arabic usage
  // for email is البريد الإلكتروني — which the bundle itself uses in
  // signUp.emailCode.title ("تحقق من بريدك الإلكتروني").
  formFieldLabel__emailAddress: "البريد الإلكتروني",
  // The imperative of اختار carries hamzat wasl: a bare alef, not أ.
  footerActionLink__useAnotherMethod: "اختر طريقة أخرى",
};

type Plain = Record<string, unknown>;

const isPlainObject = (value: unknown): value is Plain =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Merge overrides into the bundle *by path*.
 *
 * A spread would not do: `{...arSA, ...corrections}` replaces the whole
 * `signUp` object with the one-key version above, and every other signUp string
 * would fall back to English — turning a one-word fix into a half-English form.
 */
function deepMerge<T extends Plain>(base: T, overrides: Plain): T {
  const merged: Plain = { ...base };

  for (const [key, value] of Object.entries(overrides)) {
    const current = merged[key];
    merged[key] =
      isPlainObject(current) && isPlainObject(value)
        ? deepMerge(current, value)
        : value;
  }

  return merged as T;
}

export const clerkLocalization: Record<Locale, LocalizationResource> = {
  en: enUS,
  ar: deepMerge(arSA as Plain, arabicCorrections as Plain) as LocalizationResource,
};
