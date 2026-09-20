import { describe, it, expect } from "vitest";
import enOrg from "@/messages/en/org.json";
import arOrg from "@/messages/ar/org.json";
import enCarAttributes from "@/messages/en/carAttributes.json";
import arCarAttributes from "@/messages/ar/carAttributes.json";
import { sidebarItems } from "@/lib/SidebarConfig";

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
    // Pure punctuation around already-formatted values. There is nothing in
    // either to translate, and the bracket direction is the renderer's job.
    const NOT_LANGUAGE = new Set([
      "dashboard.funnel.share",
      "dashboard.inventory.legend",
    ]);

    const untranslated = flatten(enOrg)
      .filter(([key, value]) => !NOT_LANGUAGE.has(key) && at(arOrg, key) === value)
      .map(([key]) => key);

    expect(untranslated).toEqual([]);
  });

  it("uses {value} rather than ICU # for interpolated numbers", () => {
    // `#` formats with the bare routing locale, which gives Western digits in
    // Arabic while every other number on the page uses Eastern ones. See
    // lib/utils/intl-locale.
    const withHash = [enOrg, arOrg].flatMap((messages) =>
      flatten(messages)
        .filter(([, value]) => value.includes("#"))
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
