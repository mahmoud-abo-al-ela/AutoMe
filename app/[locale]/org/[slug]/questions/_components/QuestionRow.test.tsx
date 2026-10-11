import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en/org.json";
import ar from "@/messages/ar/org.json";

vi.mock("next/navigation", () => ({ useParams: () => ({ slug: "nile-motors" }) }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { QuestionRow } from "./QuestionRow";
import type { InboxQuestion } from "./BuyerQuestionsPresenter";

const base = {
  id: "q2",
  question: "Was it ever crashed?",
  locale: "en",
  askCount: 1,
  lastAskedAt: new Date(Date.now() - 60 * 60_000),
  status: "OPEN",
  answer: null,
  appliesToAllCars: false,
  answeredAt: null,
  declineMessage: "The listing doesn't say whether it has been in an accident — the dealer can tell you.",
  relatedQuestion: { id: "q1", question: "Has it been in an accident?", answer: "No accidents, original paint.", status: "ANSWERED" },
  suggestion: null,
  car: { id: "car-1", make: "Hyundai", model: "Elantra", year: 2019, title: null, titleEn: null, titleAr: null },
} as unknown as InboxQuestion;

function render(locale: "en" | "ar", question: InboxQuestion = base) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={{ org: locale === "ar" ? ar : en }} timeZone="Africa/Cairo">
      <QuestionRow
        question={question}
        isOpen={false}
        isPending={false}
        autoFocus={false}
        draft={undefined}
        onDraft={() => {}}
        onOpen={() => {}}
        onClose={() => {}}
        onDiscard={() => {}}
        onAnswer={() => {}}
        onDismiss={() => {}}
        onReopen={() => {}}
      />
    </NextIntlClientProvider>
  );
}

describe("QuestionRow — a question the assistant missed", () => {
  it("flags it, with the dealer's earlier answer and what the assistant told the buyer", () => {
    const html = render("en");
    expect(html).toContain("Needs attention");
    expect(html).toContain("Has it been in an accident?");
    expect(html).toContain("No accidents, original paint.");
    expect(html).toContain("the dealer can tell you.");
  });

  it("reads in Arabic on an Arabic page", () => {
    const html = render("ar");
    expect(html).toContain("يحتاج إلى انتباهك");
    expect(html).toContain("ما قاله المساعد للمشتري");
  });

  it("shows no flag once the earlier question is no longer answered, or for an unlinked question", () => {
    expect(render("en", { ...base, relatedQuestion: { ...base.relatedQuestion!, status: "OPEN" } } as InboxQuestion)).not.toContain("Needs attention");
    expect(render("en", { ...base, relatedQuestion: null } as InboxQuestion)).not.toContain("Needs attention");
  });
});
