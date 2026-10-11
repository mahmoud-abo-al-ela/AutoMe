import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en/cars.json";
import ar from "@/messages/ar/cars.json";
import { SearchMatchNotice } from "./SearchNotice";
import type { SearchMatch } from "@/lib/services/car/listing";

function render(locale: "en" | "ar", searchMatch: SearchMatch) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={{ cars: locale === "ar" ? ar : en }} timeZone="Africa/Cairo">
      <SearchMatchNotice searchMatch={searchMatch} locale={locale} />
    </NextIntlClientProvider>
  );
}

describe("SearchMatchNotice", () => {
  it("names the words no car has, in Arabic", () => {
    const html = render("ar", { match: "all", missing: ["عربية"] });
    expect(html).toContain('role="status"');
    expect(html).toContain("<bdi");
    expect(html).toContain("عربية");
    expect(html).toContain("نعرض نتائج بقية كلمات بحثك");
  });

  it("lists several set-aside words", () => {
    expect(render("en", { match: "all", missing: ["please", "thanks"] })).toMatch(/please.*thanks/);
  });

  it("says when no car had every word", () => {
    expect(render("en", { match: "some", missing: [] })).toContain("No car has all of your words");
  });

  it("says when the cars are the closest in meaning", () => {
    expect(render("en", { match: "meaning", missing: ["zzqx"] })).toContain("closest to what you described");
    expect(render("en", { match: "meaning", missing: [] })).toContain("closest to what you described");
  });

  it("says nothing when every word matched, or a typo was matched by spelling", () => {
    expect(render("en", { match: "all", missing: [] })).toBe("");
    expect(render("en", { match: "similar", missing: [] })).toBe("");
  });
});
