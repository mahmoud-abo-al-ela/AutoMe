import { describe, it, expect } from "vitest";
import { buildBillingEmail, type BillingEmail } from "@/lib/services/notification/billing-email-template";

const pro = { type: "PRO", name: "Pro" };
const end = new Date("2026-10-31T22:00:00Z"); // 00:00 Cairo, 1 Nov

const EMAILS: BillingEmail[] = [
  { kind: "renewalDue", plan: pro, amountCents: 150_000, period: "MONTHLY", endsAt: end },
  { kind: "renewalReminder", plan: pro, amountCents: 1_500_000, period: "YEARLY", endsAt: end },
  { kind: "trialDue", plan: pro, amountCents: 150_000, period: "MONTHLY", endsAt: end },
  { kind: "trialReminder", plan: pro, amountCents: 150_000, period: "MONTHLY", endsAt: end },
  { kind: "pastDue", plan: pro, payBy: end },
  { kind: "downgradedCanceled", plan: pro },
  { kind: "downgradedUnpaid", plan: pro },
  { kind: "paymentReceived", plan: pro, amountCents: 150_000, until: end, startsOn: null },
  { kind: "paymentReceived", plan: pro, amountCents: 150_000, until: end, startsOn: end },
  { kind: "paymentFailed", plan: pro, amountCents: 150_000 },
];

describe("buildBillingEmail", () => {
  it.each(["en", "ar"] as const)("words every billing email in %s, with nothing left as a raw key", (locale) => {
    for (const email of EMAILS) {
      const { subject, html } = buildBillingEmail({ locale, dealership: "Nile Motors", slug: "nile-motors", email });
      expect(subject, email.kind).not.toMatch(/billing\.|\{|\}/);
      expect(html, email.kind).not.toMatch(/billing\.[a-zA-Z]/);
      expect(html, email.kind).not.toMatch(/\{(plan|amount|date|dealership|start|period)\}/);
      expect(html).toContain(`dir="${locale === "ar" ? "rtl" : "ltr"}"`);
    }
  });

  it("states the amount in EGP and the date in Cairo", () => {
    const { subject, html } = buildBillingEmail({
      locale: "en",
      dealership: "Nile Motors",
      slug: "nile-motors",
      email: EMAILS[0],
    });
    expect(subject).toBe("Your Professional plan renews on November 1, 2026");
    expect(html).toMatch(/EGP\s1,500/);
    expect(html).toContain("for the next month");
  });

  it("links every email to the dealership's billing page in its language", () => {
    const { html } = buildBillingEmail({ locale: "ar", dealership: "Nile", slug: "nile-motors", email: EMAILS[4] });
    expect(html).toMatch(/href="[^"]*\/ar\/org\/nile-motors\/billing"/);
    const free = buildBillingEmail({ locale: "en", dealership: "Nile", slug: "nile-motors", email: EMAILS[6] });
    expect(free.html).toMatch(/href="[^"]*\/en\/org\/nile-motors\/billing#plans"/);
  });

  it("escapes the dealership's name", () => {
    const { html } = buildBillingEmail({
      locale: "en",
      dealership: "<script>x</script>",
      slug: "x",
      email: EMAILS[5],
    });
    expect(html).not.toContain("<script>");
  });
});
