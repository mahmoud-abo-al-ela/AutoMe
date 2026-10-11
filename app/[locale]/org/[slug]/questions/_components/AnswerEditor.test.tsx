import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en/org.json";
import ar from "@/messages/ar/org.json";
import { AnswerEditor, type AnswerSuggestion } from "./AnswerEditor";

const SUGGESTION: AnswerSuggestion = {
  question: "Do you offer installments?",
  answer: "Yes — up to 5 years through NBE.",
  appliesToAllCars: false,
};

function render(locale: "en" | "ar", initialAnswer = "", suggestion: AnswerSuggestion | null = SUGGESTION) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={{ org: locale === "ar" ? ar : en }} timeZone="Africa/Cairo">
      <AnswerEditor
        initial={{ answer: initialAnswer, allCars: false }}
        onDraft={() => {}}
        submitLabel="Publish"
        secondary={{ label: "Dismiss", onClick: () => {} }}
        onSubmit={() => {}}
        onClose={() => {}}
        isPending={false}
        suggestion={suggestion}
      />
    </NextIntlClientProvider>
  );
}

describe("AnswerEditor — a suggested answer", () => {
  it("offers the answer given on another car, with a way to use it", () => {
    const html = render("en");
    expect(html).toContain("You answered a similar question on another car");
    expect(html).toContain("Do you offer installments?");
    expect(html).toContain("Yes — up to 5 years through NBE.");
    expect(html).toContain("Reuse this answer");
  });

  it("is in Arabic on an Arabic page", () => {
    const html = render("ar");
    expect(html).toContain("أجبت عن سؤال مشابه على سيارة أخرى");
    expect(html).toContain("أعد استخدام هذه الإجابة");
  });

  it("steps aside once the answer is already in the box, and when there is none", () => {
    expect(render("en", SUGGESTION.answer)).not.toContain("You answered a similar question");
    expect(render("en", "", null)).not.toContain("You answered a similar question");
  });
});
