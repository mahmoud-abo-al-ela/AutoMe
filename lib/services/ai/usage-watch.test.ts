import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const repo = vi.hoisted(() => ({ findOrganizationsOverCallCount: vi.fn() }));
const report = vi.hoisted(() => ({ reportSignal: vi.fn(async () => undefined) }));
vi.mock("@/lib/repositories/ai-usage", () => repo);
vi.mock("@/lib/observability/report", () => report);

import { DEFAULT_DAILY_CALLS_ALERT, watchAiUsage } from "./usage-watch";

const NOW = new Date("2026-10-15T04:45:00Z");

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  delete process.env.AI_DAILY_CALLS_ALERT;
});

describe("the daily AI usage watch", () => {
  it("asks for the last 24 hours against the default threshold", async () => {
    repo.findOrganizationsOverCallCount.mockResolvedValue([]);

    const result = await watchAiUsage(NOW);

    expect(repo.findOrganizationsOverCallCount).toHaveBeenCalledWith(new Date("2026-10-14T04:45:00Z"), DEFAULT_DAILY_CALLS_ALERT);
    expect(result.organizations).toEqual([]);
    expect(report.reportSignal).not.toHaveBeenCalled();
  });

  it("raises one warning per dealership over it, an issue each", async () => {
    repo.findOrganizationsOverCallCount.mockResolvedValue([
      { organizationId: "org-a", calls: 900 },
      { organizationId: "org-b", calls: 610 },
    ]);

    await watchAiUsage(NOW);

    expect(report.reportSignal).toHaveBeenCalledTimes(2);
    expect(report.reportSignal).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ai.usage-spike", level: "warning", tags: { "organization.id": "org-a" }, groupBy: "org-a" })
    );
  });

  it("takes its threshold from AI_DAILY_CALLS_ALERT, and ignores a value that is not a positive number", async () => {
    repo.findOrganizationsOverCallCount.mockResolvedValue([]);

    process.env.AI_DAILY_CALLS_ALERT = "120";
    await watchAiUsage(NOW);
    expect(repo.findOrganizationsOverCallCount).toHaveBeenLastCalledWith(expect.any(Date), 120);

    process.env.AI_DAILY_CALLS_ALERT = "lots";
    await watchAiUsage(NOW);
    expect(repo.findOrganizationsOverCallCount).toHaveBeenLastCalledWith(expect.any(Date), DEFAULT_DAILY_CALLS_ALERT);
  });
});
