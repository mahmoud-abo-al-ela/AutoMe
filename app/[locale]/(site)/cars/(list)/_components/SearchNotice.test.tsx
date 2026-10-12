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
    const html = render("ar", { match: "all", missing: ["عربية"], corrected: [] });
    expect(html).toContain('role="status"');
    expect(html).toContain("<bdi");
    expect(html).toContain("عربية");
    expect(html).toContain("نعرض نتائج بقية كلمات بحثك");
  });

  it("lists several set-aside words", () => {
    expect(render("en", { match: "all", missing: ["please", "thanks"], corrected: [] })).toMatch(/please.*thanks/);
  });

  it("says when no car had every word", () => {
    expect(render("en", { match: "some", missing: [], corrected: [] })).toContain("No car has all of your words");
  });

  it("says when the cars are the closest in meaning", () => {
    expect(render("en", { match: "meaning", missing: ["zzqx"], corrected: [] })).toContain("closest to what you described");
    expect(render("en", { match: "meaning", missing: [], corrected: [] })).toContain("closest to what you described");
  });

  it("says which word a typo was read as", () => {
    const html = render("en", { match: "all", missing: [], corrected: [{ from: "corola", to: ["corolla"] }] });
    expect(html).toContain("Showing results for <bdi");
    expect(html).toContain("corolla</bdi> instead of “corola”");
  });

  it("offers every reading when it could not tell which was meant, in Arabic", () => {
    const html = render("ar", { match: "all", missing: [], corrected: [{ from: "كرولا", to: ["كورولا", "كرولي"] }] });
    expect(html).toContain("كورولا أو كرولي");
    expect(html).toContain("«كرولا»");
  });

  it("says a typo was read before a word set aside", () => {
    const html = render("en", { match: "all", missing: ["please"], corrected: [{ from: "corola", to: ["corolla"] }] });
    expect(html.indexOf("corolla")).toBeLessThan(html.indexOf("please"));
  });

  it("offers the words as typed after a correction, when the page can search them", () => {
    const corrected: SearchMatch = { match: "all", missing: [], corrected: [{ from: "corola", to: ["corolla"] }] };
    const html = renderToStaticMarkup(
      <NextIntlClientProvider locale="en" messages={{ cars: en }} timeZone="Africa/Cairo">
        <SearchMatchNotice searchMatch={corrected} locale="en" term="corola" onSearchExact={() => undefined} />
      </NextIntlClientProvider>
    );
    expect(html).toContain('<button type="button"');
    expect(html).toContain("Search instead for <bdi");
    expect(html).toContain("“corola”</bdi>");
    // Without a way to run it, no link.
    expect(render("en", corrected)).not.toContain("<button");
  });

  it("offers it in Arabic", () => {
    const html = renderToStaticMarkup(
      <NextIntlClientProvider locale="ar" messages={{ cars: ar }} timeZone="Africa/Cairo">
        <SearchMatchNotice
          searchMatch={{ match: "all", missing: [], corrected: [{ from: "فتحت", to: ["فتحة"] }] }}
          locale="ar"
          term="فتحت"
          onSearchExact={() => undefined}
        />
      </NextIntlClientProvider>
    );
    expect(html).toContain("ابحث بدلًا من ذلك عن");
    expect(html).toContain("«فتحت»");
  });

  it("says nothing when every word matched as typed", () => {
    expect(render("en", { match: "all", missing: [], corrected: [] })).toBe("");
  });
});
