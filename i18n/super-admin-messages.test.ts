import { describe, it, expect } from "vitest";
import enSuperAdmin from "@/messages/en/superAdmin.json";
import arSuperAdmin from "@/messages/ar/superAdmin.json";
import enOrg from "@/messages/en/org.json";
import arOrg from "@/messages/ar/org.json";
import { superAdminSidebarItems } from "@/lib/SuperAdminSidebarConfig";

/**
 * Message-shape checks for the super-admin dashboard.
 *
 * Staff-only, so a missing key here is seen by few people and fixed late —
 * these catch it at test time instead. `superAdminSidebarItems` is imported
 * rather than restated, so a nav entry added without its label fails here.
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

describe("super-admin messages", () => {
  it("defines the same keys in both locales", () => {
    expect(flatten(arSuperAdmin).map(([k]) => k).sort()).toEqual(
      flatten(enSuperAdmin).map(([k]) => k).sort()
    );
  });

  it("translates every key, bar the ones that carry no words", () => {
    // Punctuation around already-formatted values, and latency percentile
    // labels that are written the same way in both languages.
    const NOT_LANGUAGE = new Set([
      "analytics.top.rank",
      "analytics.ai.columns.p50",
      "analytics.ai.columns.p95",
    ]);

    const untranslated = flatten(enSuperAdmin)
      .filter(
        ([key, value]) => !NOT_LANGUAGE.has(key) && at(arSuperAdmin, key) === value
      )
      .map(([key]) => key);

    expect(untranslated).toEqual([]);
  });

  it("uses {value} rather than ICU # inside plurals", () => {
    // Inside a plural, `#` formats with the bare routing locale, which gives
    // Western digits in Arabic while every other number on the page uses
    // Eastern ones. See lib/utils/intl-locale.
    const withHash = [enSuperAdmin, arSuperAdmin].flatMap((messages) =>
      flatten(messages)
        .filter(([, value]) => value.includes("#") && value.includes("plural,"))
        .map(([key]) => key)
    );

    expect(withHash).toEqual([]);
  });

  it("gives every Arabic plural the forms Arabic needs", () => {
    // Arabic selects zero/one/two/few/many/other. A family missing one falls
    // back to `other`, which reads wrongly for 1, 2 and 3–10.
    const missing = flatten(arSuperAdmin)
      .filter(([, value]) => value.includes("plural,"))
      .filter(([, value]) =>
        ["one", "two", "few", "many", "other"].some(
          (form) => !new RegExp(`\\b${form} \\{`).test(value)
        )
      )
      .map(([key]) => key);

    expect(missing).toEqual([]);
  });

  it("keeps the rich-text tags paired across locales", () => {
    // Rendered through `t.rich`; an unclosed or renamed tag in one locale
    // throws at render time rather than degrading.
    for (const [key, value] of flatten(enSuperAdmin)) {
      const arabic = at(arSuperAdmin, key);
      const tags = (text: string) => (text.match(/<\/?\w+>/g) ?? []).sort();

      expect(tags(arabic ?? ""), `tags differ for ${key}`).toEqual(tags(value));
    }
  });
});

describe("super-admin sidebar config and messages agree", () => {
  it.each(["en", "ar"] as const)("labels every nav item in %s", (locale) => {
    const messages = locale === "en" ? enSuperAdmin : arSuperAdmin;

    expect(superAdminSidebarItems.length).toBeGreaterThan(0);
    for (const item of superAdminSidebarItems) {
      expect(
        at(messages, `nav.${item.labelKey}`),
        `missing nav.${item.labelKey}`
      ).toBeTruthy();
    }
  });
});

describe("enum labels the super-admin screens borrow", () => {
  // Subscription statuses render through org.billing.status. The schema's
  // SubscriptionStatus enum is the source of truth for the member list.
  it.each(["en", "ar"] as const)(
    "labels every subscription status in %s",
    (locale) => {
      const messages = locale === "en" ? enOrg : arOrg;

      for (const status of ["ACTIVE", "PAST_DUE", "CANCELED", "TRIALING", "PENDING"]) {
        expect(at(messages, `billing.status.${status}`), status).toBeTruthy();
      }
    }
  );

  it.each(["en", "ar"] as const)("labels every user role in %s", (locale) => {
    const messages = locale === "en" ? enSuperAdmin : arSuperAdmin;

    for (const role of ["USER", "ADMIN"]) {
      expect(at(messages, `users.roles.${role}`), role).toBeTruthy();
    }
  });
});
