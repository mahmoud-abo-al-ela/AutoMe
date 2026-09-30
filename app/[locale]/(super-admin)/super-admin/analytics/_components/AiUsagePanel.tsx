import {
  getUsageByFeature,
  getUsageByModel,
  getFailuresByCode,
} from "@/lib/repositories/ai-usage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * What the AI actually did, and how often it failed.
 *
 * `AiUsage` has been written on every provider call since the metering work,
 * and read by nothing but the quota gate — the table carried an index
 * commented "per-feature reporting" that no query ever used. This is that
 * reader.
 *
 * Super-admin is deliberately untranslated (decided 2026-09-22), so the copy
 * here is English by design rather than by omission.
 */

const WINDOW_DAYS = 30;

/** Micro-USD is the storage unit; nobody reads a budget in millionths. */
function formatCost(microUsd: number): string {
  if (microUsd === 0) return "$0.00";
  return `$${(microUsd / 1_000_000).toFixed(2)}`;
}

function formatLatency(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function successRate(calls: number, failures: number): string {
  if (calls === 0) return "—";
  return `${Math.round(((calls - failures) / calls) * 100)}%`;
}

export default async function AiUsagePanel() {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60_000);

  const [byFeature, byModel, failures] = await Promise.all([
    getUsageByFeature(since),
    getUsageByModel(since),
    getFailuresByCode(since),
  ]);

  const totalCalls = byFeature.reduce((sum, f) => sum + f.calls, 0);
  const totalFailures = byFeature.reduce((sum, f) => sum + f.failures, 0);
  const totalCost = byFeature.reduce((sum, f) => sum + f.costMicroUsd, 0);

  if (totalCalls === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI usage — last {WINDOW_DAYS} days</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No AI calls recorded in this window.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>AI usage — last {WINDOW_DAYS} days</CardTitle>
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary">{totalCalls} calls</Badge>
          <Badge variant={totalFailures > 0 ? "destructive" : "secondary"}>
            {successRate(totalCalls, totalFailures)} success
          </Badge>
          {/* Zero on the free tier, and honestly zero rather than estimated. */}
          <Badge variant="outline">{formatCost(totalCost)}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <section>
          <h4 className="mb-2 text-sm font-semibold">By feature</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 text-start font-medium">Feature</th>
                  <th className="py-2 text-end font-medium">Calls</th>
                  <th className="py-2 text-end font-medium">Success</th>
                  <th className="py-2 text-end font-medium">Tokens in</th>
                  <th className="py-2 text-end font-medium">Tokens out</th>
                </tr>
              </thead>
              <tbody>
                {byFeature.map((row) => (
                  <tr key={row.feature} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{row.feature}</td>
                    <td className="py-2 text-end">{row.calls}</td>
                    <td className="py-2 text-end">
                      {successRate(row.calls, row.failures)}
                    </td>
                    <td className="py-2 text-end">{row.inputTokens}</td>
                    {/* Thinking tokens bill at the output rate, so they belong
                        in the same column rather than looking free. */}
                    <td className="py-2 text-end">
                      {row.outputTokens + row.thinkingTokens}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-sm font-semibold">By model</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 text-start font-medium">Model</th>
                  <th className="py-2 text-end font-medium">Calls</th>
                  <th className="py-2 text-end font-medium">Success</th>
                  <th className="py-2 text-end font-medium">p50</th>
                  <th className="py-2 text-end font-medium">p95</th>
                </tr>
              </thead>
              <tbody>
                {byModel.map((row) => (
                  <tr key={row.model} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{row.model}</td>
                    <td className="py-2 text-end">{row.calls}</td>
                    <td className="py-2 text-end">
                      {successRate(row.calls, row.failures)}
                    </td>
                    <td className="py-2 text-end">
                      {formatLatency(row.p50LatencyMs)}
                    </td>
                    {/* The number that matters: the free tier's tail is what
                        exhausts the request budget, and a mean hides it. */}
                    <td className="py-2 text-end">
                      {formatLatency(row.p95LatencyMs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {failures.length > 0 && (
          <section>
            <h4 className="mb-2 text-sm font-semibold">Failures by cause</h4>
            {/* This is the view that separates "the provider is saturated"
                from "our schema stopped matching the model", which look
                identical in a success rate. */}
            <div className="flex flex-wrap gap-2">
              {failures.map((row) => (
                <Badge key={row.errorCode} variant="outline" className="font-mono">
                  {row.errorCode} × {row.count}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
