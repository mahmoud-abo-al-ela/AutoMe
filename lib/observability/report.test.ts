import { describe, it, expect, vi, beforeEach } from "vitest";

// Sentry as the reports reach it: what scope they were captured in.
const sentry = vi.hoisted(() => {
  const scope = { tags: {} as Record<string, string>, level: "", fingerprint: [] as string[], setTag: vi.fn(), setLevel: vi.fn(), setFingerprint: vi.fn(), setContext: vi.fn() };
  scope.setTag.mockImplementation((key: string, value: string) => (scope.tags[key] = value));
  scope.setLevel.mockImplementation((level: string) => (scope.level = level));
  scope.setFingerprint.mockImplementation((fingerprint: string[]) => (scope.fingerprint = fingerprint));
  return {
    scope,
    withScope: vi.fn((fn: (s: typeof scope) => void) => fn(scope)),
    captureException: vi.fn(),
    captureMessage: vi.fn(),
  };
});
vi.mock("@sentry/nextjs", () => sentry);
vi.mock("@/lib/sentry-enabled", () => ({ sentryEnabled: true }));

import { groupingKey, reportSignal, reportUnexpected } from "./report";

beforeEach(() => {
  vi.clearAllMocks();
  sentry.scope.tags = {};
});

describe("groupingKey", () => {
  it("keeps one issue per kind of failure, not per id or count", () => {
    expect(groupingKey("Background job image-alts failed for 6b9a011c-a506-41e1-a538-7a97f7c41709")).toBe(
      "Background job image-alts failed for <id>"
    );
    expect(groupingKey("Paymob paid 120000 for payment pay_9x8y7z6w5v priced 99000")).toBe("Paymob paid <n> for payment <id> priced <n>");
  });

  it("leaves a snake_case word alone", () => {
    expect(groupingKey("renewal_reminder email failed")).toBe("renewal_reminder email failed");
  });
});

describe("reportSignal", () => {
  it("captures a named signal with its tags, level and one fingerprint per group", async () => {
    await reportSignal({ name: "job.failed", level: "error", tags: { job: "image-alts" }, groupBy: "image-alts", error: new Error("boom") });

    expect(sentry.scope.tags).toEqual({ signal: "job.failed", job: "image-alts" });
    expect(sentry.scope.level).toBe("error");
    expect(sentry.scope.fingerprint).toEqual(["signal", "job.failed", "image-alts"]);
    expect(sentry.captureException).toHaveBeenCalledTimes(1);
  });

  it("captures a message when nothing failed", async () => {
    await reportSignal({ name: "support-session.started", level: "info", tags: { "organization.id": "org-1" } });

    expect(sentry.captureMessage).toHaveBeenCalledWith("support-session.started");
    expect(sentry.captureException).not.toHaveBeenCalled();
  });
});

describe("reportUnexpected", () => {
  it("captures a logged error, grouped by where it was logged", async () => {
    await reportUnexpected(new Error("connection reset"), "Background job car-embedding failed; the queue will retry it");

    expect(sentry.scope.tags).toEqual({ signal: "unexpected" });
    expect(sentry.scope.fingerprint).toEqual(["unexpected", "Background job car-embedding failed; the queue will retry it"]);
    expect(sentry.captureException).toHaveBeenCalledTimes(1);
  });

  it("does not send an error a signal already sent", async () => {
    const error = new Error("amount mismatch");
    await reportSignal({ name: "billing.payment-rejected", level: "error", error });
    sentry.captureException.mockClear();

    await reportUnexpected(error, "Paymob paid 1 for payment x");

    expect(sentry.captureException).not.toHaveBeenCalled();
  });
});
