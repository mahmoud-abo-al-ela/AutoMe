import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en/superAdmin.json";
import ar from "@/messages/ar/superAdmin.json";

// The locale-aware Link needs the app router; a plain anchor shows the href.
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { AssistantQuality } from "./AssistantQuality";

type Data = Parameters<typeof AssistantQuality>[0]["data"];

const DATA: Data = {
  replies: { current: 10, previous: 8 },
  answered: 6,
  declined: 3,
  offTopic: 1,
  ratings: { helpful: 3, unhelpful: 1 },
  byModel: [
    { model: "google/gemini-3.5-flash-lite", promptVersion: "2026-09-29.2.ar", answers: 5, rated: 4, helpful: 3 },
    { model: null, promptVersion: null, answers: 1, rated: 0, helpful: 0 },
  ],
  unhelpful: [
    {
      id: "a1",
      carId: "car-1",
      question: "هل تعرضت السيارة لحادث؟",
      answer: "",
      model: "google/gemini-3.5-flash-lite",
      promptVersion: "2026-09-29.2.ar",
      ratedAt: new Date(Date.now() - 3 * 60 * 60_000),
      dealership: "Nile Motors",
    },
  ],
};

function render(locale: "en" | "ar", data: Data = DATA) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={{ superAdmin: locale === "ar" ? ar : en }} timeZone="Africa/Cairo">
      <AssistantQuality data={data} />
    </NextIntlClientProvider>
  );
}

describe("AssistantQuality", () => {
  it("shows the shares, the model table and the unhelpful answers, traced to their call", () => {
    const html = render("en");
    expect(html).toContain("Listing assistant");
    expect(html).toContain("60%"); // answered 6 of 10
    expect(html).toContain("30%"); // sent to the dealer
    expect(html).toContain("75%"); // 3 of 4 rated helpful
    expect(html).toContain("2026-09-29.2.ar");
    expect(html).toContain("Before tracking");
    expect(html).toContain('href="/cars/car-1"');
    // A decline in the dealer's fixed copy has no stored wording.
    expect(html).toContain("(standard reply)");
  });

  it("renders in Arabic with every string translated", () => {
    const html = render("ar");
    expect(html).toContain("مساعد الإعلانات");
    expect(html).toContain("أحدث الإجابات غير المفيدة");
    expect(html).not.toMatch(/Listing assistant|Before tracking|MISSING_MESSAGE/);
  });

  it("says so when there were no questions, instead of empty tables", () => {
    const html = render("en", { ...DATA, replies: { current: 0, previous: 0 }, answered: 0, declined: 0, offTopic: 0, byModel: [], unhelpful: [] });
    expect(html).toContain("No answers in this period.");
    expect(html).not.toContain("<table");
  });
});
