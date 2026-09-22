import { describe, it, expect } from "vitest";
import enOnboarding from "@/messages/en/onboarding.json";
import arOnboarding from "@/messages/ar/onboarding.json";
import enPlans from "@/messages/en/plans.json";
import arPlans from "@/messages/ar/plans.json";
import enHome from "@/messages/en/home.json";
import { STEPS } from "@/app/[locale]/(site)/onboarding/_components/wizard/constants";
import { DAYS } from "@/app/[locale]/(site)/onboarding/_components/working-hours/constants";
import { PLAN_CONFIG } from "@/app/[locale]/(site)/onboarding/_components/plan-selection/constants";

/**
 * Message-shape checks for the two namespaces the onboarding wizard renders
 * from. The wizard is entirely client-side and sits behind sign-in, so a
 * missing key reaches the page as visible text that no reviewer is likely to
 * see first.
 *
 * The constants are imported rather than restated: every step, day and plan
 * tier now looks its copy up by key, and a key added to one without the other
 * is exactly the failure worth catching.
 */

type Flat = [string, string][];

const flatten = (obj: Record<string, unknown>, prefix = ""): Flat =>
  Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === "object"
      ? flatten(value as Record<string, unknown>, `${prefix}${key}.`)
      : [[`${prefix}${key}`, String(value)] as [string, string]]
  );

const at = (messages: Record<string, unknown>, key: string) =>
  flatten(messages).find(([k]) => k === key)?.[1];

describe.each([
  ["onboarding", enOnboarding, arOnboarding],
  ["plans", enPlans, arPlans],
])("%s messages", (_name, en, ar) => {
  it("defines the same keys in both locales", () => {
    expect(flatten(ar).map(([k]) => k).sort()).toEqual(
      flatten(en).map(([k]) => k).sort()
    );
  });

  it("translates every key, bar the ones that carry no words", () => {
    // Neither is language. The phone placeholder keeps Western digits in both
    // locales on purpose: a number that gets dialled and pasted should not
    // change shape with the reader. See lib/utils/phone.
    const NOT_LANGUAGE = new Set([
      "orgDetails.fields.email.placeholder",
      "orgDetails.fields.phone.placeholder",
    ]);

    const untranslated = flatten(en)
      .filter(([key, value]) => !NOT_LANGUAGE.has(key) && at(ar, key) === value)
      .map(([key]) => key);

    expect(untranslated).toEqual([]);
  });

  it("uses {value} rather than ICU # for interpolated numbers", () => {
    // `#` formats with the bare routing locale, which gives Western digits in
    // Arabic while every other number on the page uses Eastern ones. See
    // lib/utils/intl-locale.
    const withHash = [en, ar].flatMap((messages) =>
      flatten(messages)
        .filter(([, value]) => value.includes("#"))
        .map(([key]) => key)
    );

    expect(withHash).toEqual([]);
  });
});

describe("onboarding constants and messages agree", () => {
  it.each(["en", "ar"] as const)("names every wizard step in %s", (locale) => {
    const messages = locale === "en" ? enOnboarding : arOnboarding;

    for (const step of STEPS) {
      expect(at(messages, `wizard.steps.${step.key}.name`)).toBeTruthy();
      expect(at(messages, `wizard.steps.${step.key}.description`)).toBeTruthy();
    }
  });

  it.each(["en", "ar"] as const)("names every day of the week in %s", (locale) => {
    const messages = locale === "en" ? enOnboarding : arOnboarding;

    expect(DAYS).toHaveLength(7);
    for (const day of DAYS) {
      expect(at(messages, `workingHours.days.${day.key}`)).toBeTruthy();
    }
  });

  it("resolves every plan badge to a message", () => {
    const badges = Object.values(PLAN_CONFIG)
      .map((config) => config.badgeKey)
      .filter((key): key is "mostPopular" => key !== null);

    expect(badges.length).toBeGreaterThan(0);
    for (const badge of badges) {
      expect(at(enPlans, badge)).toBeTruthy();
      expect(at(arPlans, badge)).toBeTruthy();
    }
  });

  it("leaves no plan copy behind in the home namespace", () => {
    // The plan names, bullets and billing copy moved out of `home.pricing` so
    // the wizard and the marketing page read one source. A key reappearing
    // here means the two have started to drift again.
    const pricing = flatten(
      (enHome as Record<string, unknown>).pricing as Record<string, unknown>
    ).map(([key]) => key);

    expect(pricing.filter((key) => key.startsWith("plans."))).toEqual([]);
    expect(pricing.filter((key) => key.startsWith("features."))).toEqual([]);
  });
});
