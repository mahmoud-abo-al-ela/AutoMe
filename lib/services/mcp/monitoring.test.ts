import { describe, it, expect, vi, beforeEach } from "vitest";

const sentry = vi.hoisted(() => {
  const scope = { setTag: vi.fn(), setLevel: vi.fn(), setFingerprint: vi.fn(), setContext: vi.fn() };
  return {
    scope,
    enabled: { value: true },
    withScope: vi.fn((run: (s: typeof scope) => void) => run(scope)),
    captureException: vi.fn(),
    captureMessage: vi.fn(),
  };
});
vi.mock("@/lib/sentry-enabled", () => ({
  get sentryEnabled() {
    return sentry.enabled.value;
  },
}));
vi.mock("@sentry/nextjs", () => ({
  withScope: sentry.withScope,
  captureException: sentry.captureException,
  captureMessage: sentry.captureMessage,
}));
const pilot = vi.hoisted(() => ({ pilotReport: vi.fn() }));
vi.mock("./pilot-report", () => pilot);
vi.mock("@/lib/services/mcp/telemetry", () => ({ recordToolCall: vi.fn() }));
vi.mock("@/lib/middleware/with-rate-limit", () => ({ enforceMcpCostlyLimit: vi.fn() }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({ ...(await importOriginal<object>()), logError: vi.fn() }));

import { MIN_CALLS, mcpHealth } from "./health";
import { reportMcpFailure, reportMcpHealthBreach } from "./monitoring";
import { logToolError } from "@/lib/mcp/public/errors";
import { NotFoundError, ServiceUnavailableError, ValidationError } from "@/lib/utils/errors";

beforeEach(() => {
  vi.clearAllMocks();
  sentry.enabled.value = true;
});

const tags = () => Object.fromEntries(sentry.scope.setTag.mock.calls);

describe("reportMcpFailure", () => {
  it("sends a failure to Sentry tagged for the MCP alert, one issue per tool and code", async () => {
    const error = new Error("database is down");
    await reportMcpFailure({ tool: "search_cars", code: "internal", error });
    expect(tags()).toEqual({ surface: "mcp", "mcp.tool": "search_cars", "mcp.error_code": "internal" });
    expect(sentry.scope.setFingerprint).toHaveBeenCalledWith(["mcp", "search_cars", "internal"]);
    expect(sentry.scope.setLevel).toHaveBeenCalledWith("error");
    expect(sentry.captureException).toHaveBeenCalledWith(error);
  });

  it("sends nothing where Sentry is off, and never throws", async () => {
    sentry.enabled.value = false;
    await reportMcpFailure({ tool: "get_car", code: "unavailable", error: new Error("x") });
    expect(sentry.withScope).not.toHaveBeenCalled();

    sentry.enabled.value = true;
    sentry.withScope.mockImplementationOnce(() => {
      throw new Error("Sentry itself failed");
    });
    await expect(reportMcpFailure({ tool: "get_car", code: "internal", error: new Error("x") })).resolves.toBeUndefined();
  });
});

describe("logToolError", () => {
  it("reports AutoMe's failures — and not a caller's ordinary refusals", async () => {
    await logToolError("search_cars", new Error("bug"));
    await logToolError("search_cars", new ServiceUnavailableError("down"));
    await logToolError("get_car", new NotFoundError("Car"));
    await logToolError("search_cars", new ValidationError("bad"));
    expect(sentry.captureException).toHaveBeenCalledTimes(2);
    expect(sentry.scope.setTag).toHaveBeenCalledWith("mcp.error_code", "unavailable");
  });
});

describe("mcpHealth", () => {
  const report = (calls: number, internal: number, unavailable: number, p95Ms = 300) => ({
    window: { since: "a", until: "b" },
    totals: {
      calls,
      internalErrorRate: internal / calls,
      unavailableRate: unavailable / calls,
      rateLimitedRate: 0,
      zeroResultRate: 0,
      referrals: 0,
    },
    tools: [{ tool: "search_cars", calls, p50Ms: 100, p95Ms, zeroResults: 0, errors: {} }],
    callersPerDay: [],
    clients: [],
    referrals: [],
  });

  it("judges nothing on too few calls", async () => {
    pilot.pilotReport.mockResolvedValue(report(MIN_CALLS - 1, 5, 5, 5_000));
    expect(await mcpHealth()).toMatchObject({ judged: false, breaches: [] });
  });

  it("passes a day within the pilot's targets", async () => {
    pilot.pilotReport.mockResolvedValue(report(1_000, 9, 4, 799));
    expect((await mcpHealth()).breaches).toEqual([]);
  });

  it("names each target a day missed", async () => {
    pilot.pilotReport.mockResolvedValue(report(1_000, 10, 5, 800));
    expect((await mcpHealth()).breaches).toEqual([
      { metric: "internalErrorRate", value: 0.01, limit: 0.01 },
      { metric: "unavailableRate", value: 0.005, limit: 0.005 },
      { metric: "p95Ms:search_cars", value: 800, limit: 800 },
    ]);
  });

  it("is sent to Sentry as one error, only when a target was missed", async () => {
    pilot.pilotReport.mockResolvedValue(report(1_000, 0, 0));
    await reportMcpHealthBreach(await mcpHealth());
    expect(sentry.captureMessage).not.toHaveBeenCalled();

    pilot.pilotReport.mockResolvedValue(report(1_000, 20, 0));
    await reportMcpHealthBreach(await mcpHealth());
    expect(sentry.captureMessage).toHaveBeenCalledWith("MCP below target: internalErrorRate 0.02 (limit 0.01)");
    expect(sentry.scope.setFingerprint).toHaveBeenCalledWith(["mcp", "daily-health"]);
    expect(tags()).toMatchObject({ surface: "mcp", "mcp.check": "daily-health" });
  });
});
