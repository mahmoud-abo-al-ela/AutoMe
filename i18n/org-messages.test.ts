import { describe, it, expect } from "vitest";
import enOrg from "@/messages/en/org.json";
import arOrg from "@/messages/ar/org.json";
import enCarAttributes from "@/messages/en/carAttributes.json";
import arCarAttributes from "@/messages/ar/carAttributes.json";
import enTestDrive from "@/messages/en/testDrive.json";
import arTestDrive from "@/messages/ar/testDrive.json";
import enOnboarding from "@/messages/en/onboarding.json";
import arOnboarding from "@/messages/ar/onboarding.json";
import enPlans from "@/messages/en/plans.json";
import arPlans from "@/messages/ar/plans.json";
import { planFeatureKeys } from "@/components/Pricing/pricing-plans";
import { getAllFeatureKeys } from "@/app/[locale]/org/[slug]/billing/_components/_lib/plan-display";
import { sidebarItems } from "@/lib/SidebarConfig";
import {
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSIONS,
  STATUS_FORM_TO_DB,
} from "@/lib/constants/car-options";

/**
 * Message-shape checks for the org dashboard shell.
 *
 * The shell sits behind sign-in and behind an organization membership, so a
 * missing key surfaces as a raw `org.nav.…` in a dealer's sidebar long before
 * anyone on this side sees it. `sidebarItems` is imported rather than
 * restated: a nav entry added without its label is the failure worth catching.
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

describe("org messages", () => {
  it("defines the same keys in both locales", () => {
    expect(flatten(arOrg).map(([k]) => k).sort()).toEqual(
      flatten(enOrg).map(([k]) => k).sort()
    );
  });

  it("translates every key, bar the ones that carry no words", () => {
    // Pure punctuation around already-formatted values, or an example address
    // that is not language. There is nothing in either to translate, and the
    // bracket direction is the renderer's job.
    const NOT_LANGUAGE = new Set([
      "settings.team.invite.emailPlaceholder",
      "billing.current.defaultPlan",
      "billing.plans.priceWithPeriod",
      "dashboard.funnel.share",
      "dashboard.inventory.legend",
      "cars.pagination.showingShort",
      "carForm.form.step",
      "testDrives.table.timeRange",
      "auditLogs.retention.withPlan",
      "auditLogs.filters.dateRange",
    ]);

    const untranslated = flatten(enOrg)
      .filter(([key, value]) => !NOT_LANGUAGE.has(key) && at(arOrg, key) === value)
      .map(([key]) => key);

    expect(untranslated).toEqual([]);
  });

  it("uses {value} rather than ICU # inside plurals", () => {
    // Inside a plural, `#` formats with the bare routing locale, which gives
    // Western digits in Arabic while every other number on the page uses
    // Eastern ones. See lib/utils/intl-locale.
    //
    // Only inside a plural: elsewhere ICU treats `#` as a literal character,
    // and an invoice number is written "#123" in English.
    const withHash = [enOrg, arOrg].flatMap((messages) =>
      flatten(messages)
        .filter(
          ([, value]) =>
            value.includes("#") &&
            (value.includes("plural,") || value.includes("selectordinal,"))
        )
        .map(([key]) => key)
    );

    expect(withHash).toEqual([]);
  });

  it("keeps the rich-text tags paired across locales", () => {
    // The impersonation banner renders these through `t.rich`. An unclosed or
    // renamed tag in one locale throws at render time rather than degrading.
    for (const [key, value] of flatten(enOrg)) {
      const arabic = at(arOrg, key);
      const tags = (text: string) => (text.match(/<\/?\w+>/g) ?? []).sort();

      expect(tags(arabic ?? ""), `tags differ for ${key}`).toEqual(tags(value));
    }
  });
});

describe("sidebar config and messages agree", () => {
  it.each(["en", "ar"] as const)("labels every nav item in %s", (locale) => {
    const messages = locale === "en" ? enOrg : arOrg;

    expect(sidebarItems.length).toBeGreaterThan(0);
    for (const item of sidebarItems) {
      expect(
        at(messages, `nav.${item.labelKey}`),
        `missing nav.${item.labelKey}`
      ).toBeTruthy();
    }
  });
});

describe("dashboard messages cover every series the charts render", () => {
  // The chart configs name their series by key. A series added to a chart
  // without its label renders the raw key in the legend, which no type check
  // catches.
  it.each(["en", "ar"] as const)("names every overview series in %s", (locale) => {
    const messages = locale === "en" ? enOrg : arOrg;

    for (const series of ["users", "cars", "testDrives"]) {
      expect(at(messages, `dashboard.overview.series.${series}`)).toBeTruthy();
    }
  });

  it.each(["en", "ar"] as const)("names every time range in %s", (locale) => {
    const messages = locale === "en" ? enOrg : arOrg;

    for (const range of ["last7", "last14", "last30", "last90"]) {
      expect(at(messages, `dashboard.ranges.${range}`)).toBeTruthy();
    }
  });

  it.each(["en", "ar"] as const)("names every car status in %s", (locale) => {
    // The inventory pie and the popular-cars badges both read these. They
    // live in carAttributes because a car status is a car attribute, not a
    // dashboard one — carDetail still carries its own copy under
    // "badges.status*", which should fold into this when the cars surface is
    // translated.
    const messages = locale === "en" ? enCarAttributes : arCarAttributes;

    for (const status of ["AVAILABLE", "SOLD", "UNAVAILABLE"]) {
      expect(at(messages, `status.${status}`)).toBeTruthy();
    }
  });
});

describe("car form options resolve to labels", () => {
  // The selects render `t(value)` against carAttributes, where the value IS
  // the key — it is also the string stored in the database. A constant added
  // to car-options without its label shows the dealer a raw key in a dropdown,
  // and no type check sees it.
  it.each(["en", "ar"] as const)("names every body type in %s", (locale) => {
    const messages = locale === "en" ? enCarAttributes : arCarAttributes;

    expect(BODY_TYPES.length).toBeGreaterThan(0);
    for (const type of BODY_TYPES) {
      expect(at(messages, `body.${type}`), `missing body.${type}`).toBeTruthy();
    }
  });

  it.each(["en", "ar"] as const)("names every fuel type in %s", (locale) => {
    const messages = locale === "en" ? enCarAttributes : arCarAttributes;

    for (const type of FUEL_TYPES) {
      expect(at(messages, `fuel.${type}`), `missing fuel.${type}`).toBeTruthy();
    }
  });

  it.each(["en", "ar"] as const)("names every transmission in %s", (locale) => {
    const messages = locale === "en" ? enCarAttributes : arCarAttributes;

    for (const type of TRANSMISSIONS) {
      expect(
        at(messages, `transmission.${type}`),
        `missing transmission.${type}`
      ).toBeTruthy();
    }
  });

  it("maps every form status token to a translated status", () => {
    // StatusSection stores the English form token and translates through this
    // map, so a token without a mapping would render the key.
    const messages = enCarAttributes;

    for (const [token, dbValue] of Object.entries(STATUS_FORM_TO_DB)) {
      expect(at(messages, `status.${dbValue}`), `missing for ${token}`).toBeTruthy();
    }
  });
});

describe("test-drive status labels are shared, not duplicated", () => {
  it.each(["en", "ar"] as const)("names every status in %s", (locale) => {
    // The org badge, the filter dropdown and the public test-drive surface
    // all read `testDrive.status`. The badge renders nothing for a status it
    // has no class for, which is how COMPLETED used to show a blank cell.
    const messages = locale === "en" ? enTestDrive : arTestDrive;

    for (const status of ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]) {
      expect(at(messages, `status.${status}`), `missing ${status}`).toBeTruthy();
    }
  });
});

describe("settings reuses the onboarding copy it shares", () => {
  // The dealer sets the profile and the working hours during onboarding and
  // edits them again in settings. Both surfaces read one source, so a key
  // renamed on one side has to fail here rather than render raw in the other.
  it.each(["en", "ar"] as const)("names every day of the week in %s", (locale) => {
    const messages = locale === "en" ? enOnboarding : arOnboarding;

    for (const day of [
      "saturday",
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ]) {
      expect(
        at(messages, `workingHours.days.${day}`),
        `missing workingHours.days.${day}`
      ).toBeTruthy();
    }
  });

  it.each(["en", "ar"] as const)("labels every profile field in %s", (locale) => {
    const messages = locale === "en" ? enOnboarding : arOnboarding;

    for (const field of ["name", "email", "phone", "address"]) {
      expect(at(messages, `orgDetails.fields.${field}.label`)).toBeTruthy();
    }

    for (const part of ["country", "region", "city"]) {
      for (const key of [
        "label",
        "placeholder",
        "searchPlaceholder",
        "emptyMessage",
      ]) {
        expect(
          at(messages, `orgDetails.location.${part}.${key}`),
          `missing orgDetails.location.${part}.${key}`
        ).toBeTruthy();
      }
    }
  });
});

describe("billing reads the shared plan source", () => {
  // The billing page used to derive its own feature bullets from the plan's
  // columns and a camelCase split of the Json column's keys — English by
  // construction, and different English from the marketing cards. Both read
  // `planFeatureKeys` now, so every key it can emit needs a message.
  const PLANS: Parameters<typeof planFeatureKeys>[0][] = [
    {
      name: "Starter",
      monthlyPrice: 0,
      maxCars: 15,
      maxMembers: 2,
      maxImagesPerCar: 5,
      auditLogRetentionDays: 90,
      features: { chat: false, aiProcessing: { enabled: false }, prioritySupport: false },
    },
    {
      name: "Enterprise",
      monthlyPrice: null,
      maxCars: -1,
      maxMembers: -1,
      maxImagesPerCar: 20,
      auditLogRetentionDays: null,
      features: { chat: true, aiProcessing: { enabled: true }, prioritySupport: true },
    },
  ];

  it.each(["en", "ar"] as const)("names every feature bullet in %s", (locale) => {
    const messages = locale === "en" ? enPlans : arPlans;

    // Both the limited and the unlimited branch of every bullet.
    const keys = new Set(
      PLANS.flatMap((plan) => planFeatureKeys(plan)).map((f) => f.key)
    );

    expect(keys.size).toBeGreaterThan(0);
    for (const key of keys) {
      expect(at(messages, `features.${key}`), `missing features.${key}`).toBeTruthy();
    }
  });

  it("gives the comparison table one row per feature key", () => {
    // Rows used to be keyed by the rendered name, so the row set changed with
    // the reader's language.
    const rows = getAllFeatureKeys(PLANS);
    const keys = rows.map((row) => row.key);

    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("carListings");
    expect(keys).toContain("aiProcessing");
  });
});
