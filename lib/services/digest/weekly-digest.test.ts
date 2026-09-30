import { describe, it, expect, vi, beforeEach } from "vitest";

const repo = vi.hoisted(() => ({
  findDigestOrganizations: vi.fn(),
  countWeeklyActivity: vi.fn(),
  claimDigestSend: vi.fn(),
  markDigestSent: vi.fn(),
  releaseDigestSend: vi.fn(),
}));
const { countOrgAiCarsThisMonth, findActiveSubscription, writeWeeklySummary, sendEmail } = vi.hoisted(() => ({
  countOrgAiCarsThisMonth: vi.fn(),
  findActiveSubscription: vi.fn(),
  writeWeeklySummary: vi.fn(),
  sendEmail: vi.fn(),
}));
vi.mock("@/lib/repositories/digest", () => repo);
vi.mock("@/lib/repositories/ai-usage", () => ({ countOrgAiCarsThisMonth }));
vi.mock("@/lib/repositories/billing", () => ({ findActiveSubscription }));
vi.mock("@/lib/middleware/plan-limits", () => ({ DEALER_METERED_FEATURES: ["carListingFromImage"] }));
vi.mock("@/lib/services/ai", () => ({ writeWeeklySummary }));
vi.mock("@/lib/resend", () => ({ sendEmail }));
vi.mock("@/lib/utils/errors", () => ({ logError: vi.fn() }));

import { runWeeklyDigest } from "@/lib/services/digest/weekly-digest";

/** Saturday 2026-09-26 10:00 Cairo: due, for the week of the 19th. */
const SATURDAY = new Date("2026-09-26T07:00:00Z");
const FAR = { deadline: Number.MAX_SAFE_INTEGER };

function org(id: string, emails: (string | null)[] = [`${id}@example.com`], emailLocale = "ar") {
  return {
    id,
    name: `Dealer ${id}`,
    slug: id,
    emailLocale,
    memberships: emails.map((email) => ({ user: { email, name: "Owner" } })),
  };
}

const ACTIVITY = {
  carsListed: 3,
  carsAvailable: 12,
  testDriveRequests: 2,
  testDrivesPending: 1,
  assistantAnswers: 5,
  answersHelpful: 4,
  answersUnhelpful: 1,
  questionsNew: 2,
  questionsOpen: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  repo.findDigestOrganizations.mockResolvedValue([org("a")]);
  repo.countWeeklyActivity.mockResolvedValue(ACTIVITY);
  repo.claimDigestSend.mockResolvedValue(true);
  countOrgAiCarsThisMonth.mockResolvedValue(4);
  findActiveSubscription.mockResolvedValue({ plan: { features: { aiProcessing: { enabled: true, limit: 10 } } } });
  writeWeeklySummary.mockResolvedValue({
    summary: "استقبلت ٢ طلب تجربة قيادة وأضفت ٣ سيارات.",
    tip: "أكّد طلب التجربة المنتظر.",
  });
  sendEmail.mockResolvedValue({ data: "OK", error: null });
});

describe("runWeeklyDigest", () => {
  it("claims the week, sends to the owners in the dealership's language, and records it", async () => {
    const report = await runWeeklyDigest(SATURDAY, FAR);

    expect(report).toMatchObject({ week: "2026-09-19", due: true, sent: 1, failed: 0, withoutSummary: 0 });
    expect(repo.claimDigestSend).toHaveBeenCalledWith("a", new Date("2026-09-19T00:00:00Z"));
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const { to, subject, html } = sendEmail.mock.calls[0][0];
    expect(to).toBe("a@example.com");
    expect(subject).toContain("Dealer a");
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("استقبلت ٢ طلب");
    expect(repo.markDigestSent).toHaveBeenCalledWith("a", new Date("2026-09-19T00:00:00Z"), 1);
  });

  it("sends nothing on Saturday before 09:00 Cairo", async () => {
    const report = await runWeeklyDigest(new Date("2026-09-26T05:30:00Z"), FAR);
    expect(report.due).toBe(false);
    expect(repo.findDigestOrganizations).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends once when the cron fires twice: a claimed week is skipped", async () => {
    repo.claimDigestSend.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await runWeeklyDigest(SATURDAY, FAR);
    const second = await runWeeklyDigest(SATURDAY, FAR);
    expect(second).toMatchObject({ sent: 0, skipped: 1 });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("drops a summary that quotes a number the week does not have, and still sends the figures", async () => {
    writeWeeklySummary.mockResolvedValue({ summary: "You had 9 test drive requests.", tip: "Keep going." });
    const report = await runWeeklyDigest(SATURDAY, FAR);
    expect(report).toMatchObject({ sent: 1, withoutSummary: 1 });
    expect(sendEmail.mock.calls[0][0].html).not.toContain("9 test drive");
  });

  it("still sends the figures when the model fails", async () => {
    writeWeeklySummary.mockRejectedValue(new Error("every model busy"));
    expect(await runWeeklyDigest(SATURDAY, FAR)).toMatchObject({ sent: 1, withoutSummary: 1 });
  });

  it("gives the week back when no owner could be reached, so the next run retries", async () => {
    sendEmail.mockResolvedValue({ data: null, error: new Error("EmailJS down") });
    const report = await runWeeklyDigest(SATURDAY, FAR);
    expect(report).toMatchObject({ sent: 0, failed: 1 });
    expect(repo.releaseDigestSend).toHaveBeenCalledWith("a", new Date("2026-09-19T00:00:00Z"));
    expect(repo.markDigestSent).not.toHaveBeenCalled();
  });

  it("skips a dealership with no owner address without claiming its week", async () => {
    repo.findDigestOrganizations.mockResolvedValue([org("b", [null])]);
    expect(await runWeeklyDigest(SATURDAY, FAR)).toMatchObject({ sent: 0, skipped: 1 });
    expect(repo.claimDigestSend).not.toHaveBeenCalled();
  });

  it("writes an English dealership's email in English", async () => {
    repo.findDigestOrganizations.mockResolvedValue([org("c", ["c@example.com"], "en")]);
    writeWeeklySummary.mockResolvedValue({ summary: "You listed 3 cars.", tip: "Confirm the 1 pending request." });
    await runWeeklyDigest(SATURDAY, FAR);
    expect(writeWeeklySummary.mock.calls[0][1]).toBe("en");
    const { html, subject } = sendEmail.mock.calls[0][0];
    expect(html).toContain('dir="ltr"');
    expect(subject).toContain("Your week on AutoMe");
    expect(html).toContain("4 of 10");
  });

  it("stops at its deadline and leaves the rest for the next run", async () => {
    repo.findDigestOrganizations.mockResolvedValue([org("a"), org("d")]);
    const report = await runWeeklyDigest(SATURDAY, { deadline: Date.now() - 1 });
    expect(report.stoppedEarly).toBe(true);
    expect(repo.claimDigestSend).not.toHaveBeenCalled();
  });
});
