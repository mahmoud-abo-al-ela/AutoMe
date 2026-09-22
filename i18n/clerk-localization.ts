import type { ComponentProps } from "react";
import { arSA, enUS } from "@clerk/localizations";
import type { ClerkProvider } from "@clerk/nextjs";
import type { Locale } from "@/i18n/routing";
import arabicGaps from "./clerk-ar-gaps.json";

type LocalizationResource = typeof enUS;

type ClerkLocalization = NonNullable<
  ComponentProps<typeof ClerkProvider>["localization"]
>;

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

const arabicCorrections: DeepPartial<LocalizationResource> = {
  signUp: {
    start: {
      title: "إنشاء حساب جديد",
    },
  },
  signIn: {
    password: {
      title: "أدخل كلمة المرور",
    },
  },
  formFieldLabel__emailAddress: "البريد الإلكتروني",
  footerActionLink__useAnotherMethod: "اختر طريقة أخرى",
};

type Plain = Record<string, unknown>;

const isPlainObject = (value: unknown): value is Plain =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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

export const clerkLocalization: Record<Locale, ClerkLocalization> = {
  en: enUS as unknown as ClerkLocalization,
  ar: deepMerge(
    deepMerge(arSA as Plain, arabicGaps as Plain),
    arabicCorrections as Plain
  ) as unknown as ClerkLocalization,
};
