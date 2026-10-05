import {
  getUsageByFeature,
  getUsageByModel,
  getFailuresByCode,
} from "@/lib/repositories/ai-usage";
import { getLocale, getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils/number";
import type { Locale } from "@/i18n/routing";

/**
 * What the AI actually did, and how often it failed.
 *
 * `AiUsage` has been written on every provider call since the metering work,
 * and read by nothing but the quota gate — the table carried an index
 * commented "per-feature reporting" that no query ever used. This is that
 * reader.
 *
 * Feature names, model ids and error codes are identifiers, not copy, so they
 * stay as stored in either language.
 */

const WINDOW_DAYS = 30;

/**
 * Micro-USD is the storage unit; nobody reads a budget in millionths. Dollars,
 * not EGP: this is what the AI provider bills, not anything a dealer pays.
 */
function formatCost(microUsd: number, locale: Locale): string {
  return formatNumber(microUsd / 1_000_000, locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatLatency(ms: number, locale: Locale): string {
  return ms >= 1000
    ? formatNumber(ms / 1000, locale, {
        style: "unit",
        unit: "second",
        unitDisplay: "narrow",
        maximumFractionDigits: 1,
      })
    : formatNumber(ms, locale, {
        style: "unit",
        unit: "millisecond",
        unitDisplay: "narrow",
      });
}

function successRate(calls: number, failures: number, locale: Locale): string {
  if (calls === 0) return "—";
  return formatNumber((calls - failures) / calls, locale, { style: "percent" });
}

export default async function AiUsagePanel() {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60_000);
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("superAdmin.analytics.ai");
  const number = (value: number) => formatNumber(value, locale);
  const title = t("title", { days: number(WINDOW_DAYS) });

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
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t("empty")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary">
            {t("calls", { count: totalCalls, value: number(totalCalls) })}
          </Badge>
          <Badge variant={totalFailures > 0 ? "destructive" : "secondary"}>
            {t("success", {
              value: successRate(totalCalls, totalFailures, locale),
            })}
          </Badge>
          {/* Zero on the free tier, and honestly zero rather than estimated. */}
          <Badge variant="outline">{formatCost(totalCost, locale)}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <section>
          <h4 className="mb-2 text-sm font-semibold">{t("byFeature")}</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 text-start font-medium">{t("columns.feature")}</th>
                  <th className="py-2 text-end font-medium">{t("columns.calls")}</th>
                  <th className="py-2 text-end font-medium">{t("columns.success")}</th>
                  <th className="py-2 text-end font-medium">{t("columns.tokensIn")}</th>
                  <th className="py-2 text-end font-medium">{t("columns.tokensOut")}</th>
                </tr>
              </thead>
              <tbody>
                {byFeature.map((row) => (
                  <tr key={row.feature} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{row.feature}</td>
                    <td className="py-2 text-end">{number(row.calls)}</td>
                    <td className="py-2 text-end">
                      {successRate(row.calls, row.failures, locale)}
                    </td>
                    <td className="py-2 text-end">{number(row.inputTokens)}</td>
                    {/* Thinking tokens bill at the output rate, so they belong
                        in the same column rather than looking free. */}
                    <td className="py-2 text-end">
                      {number(row.outputTokens + row.thinkingTokens)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-sm font-semibold">{t("byModel")}</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 text-start font-medium">{t("columns.model")}</th>
                  <th className="py-2 text-end font-medium">{t("columns.calls")}</th>
                  <th className="py-2 text-end font-medium">{t("columns.success")}</th>
                  <th className="py-2 text-end font-medium">{t("columns.p50")}</th>
                  <th className="py-2 text-end font-medium">{t("columns.p95")}</th>
                </tr>
              </thead>
              <tbody>
                {byModel.map((row) => (
                  <tr key={row.model} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{row.model}</td>
                    <td className="py-2 text-end">{number(row.calls)}</td>
                    <td className="py-2 text-end">
                      {successRate(row.calls, row.failures, locale)}
                    </td>
                    <td className="py-2 text-end">
                      {formatLatency(row.p50LatencyMs, locale)}
                    </td>
                    {/* The number that matters: the free tier's tail is what
                        exhausts the request budget, and a mean hides it. */}
                    <td className="py-2 text-end">
                      {formatLatency(row.p95LatencyMs, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {failures.length > 0 && (
          <section>
            <h4 className="mb-2 text-sm font-semibold">{t("failures")}</h4>
            {/* This is the view that separates "the provider is saturated"
                from "our schema stopped matching the model", which look
                identical in a success rate. */}
            <div className="flex flex-wrap gap-2">
              {failures.map((row) => (
                <Badge key={row.errorCode} variant="outline" className="font-mono">
                  {row.errorCode} × {number(row.count)}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
