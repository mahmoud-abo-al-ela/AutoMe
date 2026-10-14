import { describe, it, expect, vi, beforeEach } from "vitest";

const report = vi.hoisted(() => ({ reportSignal: vi.fn(async () => undefined), reportUnexpected: vi.fn(async () => undefined) }));
vi.mock("@/lib/observability/report", () => report);

import { AuthorizationError, PlanLimitError, ValidationError, logError } from "./errors";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("logError and Sentry", () => {
  it("sends an unexpected error, with where it was logged", () => {
    const error = new Error("connection reset");
    logError("Billing audit log failed", error);

    expect(report.reportUnexpected).toHaveBeenCalledWith(error, "Billing audit log failed");
  });

  it("sends a message logged on its own as an error too", () => {
    logError("QStash signing keys are not configured; refusing background job");

    expect(report.reportUnexpected).toHaveBeenCalledTimes(1);
  });

  it("turns a refused access into the authz.refused signal, not an error", () => {
    logError(new AuthorizationError("No access to this organization"));

    expect(report.reportSignal).toHaveBeenCalledWith(expect.objectContaining({ name: "authz.refused", level: "warning" }));
    expect(report.reportUnexpected).not.toHaveBeenCalled();
  });

  it("keeps other expected errors in the log only", () => {
    logError(new ValidationError("Price is required", "price"));
    logError(new PlanLimitError({ resource: "cars" }));

    expect(report.reportSignal).not.toHaveBeenCalled();
    expect(report.reportUnexpected).not.toHaveBeenCalled();
  });
});
