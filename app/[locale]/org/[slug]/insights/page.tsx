import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import type { Insights } from "@/lib/services/dashboard";
import { formatNumber } from "@/lib/utils/number";
import { INSIGHT_PERIODS } from "@/lib/validations/schemas";
import { cn } from "@/lib/utils";
import { getInsights } from "@/actions/dashboard";
import { OrgPageHeader } from "../_components/OrgPageHeader";
import { Panel, StatGrid } from "../_components/Panel";
import { DrivesChart } from "../_components/DrivesChart";
import { CAR_STATUS_TONE } from "../_components/status-tones";
import { PeriodSelect } from "./_components/PeriodSelect";
import { ExportCsvButton, InsightsTable } from "./_components/InsightsTable";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "org.insights.meta" });
  return { title: t("title"), description: t("description") };
}

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ days?: string }>;
};

/**
 * Insights (canvas: Round 3 — Insights; page pattern 9, analytical): the
 * period comes first and everything below follows it — four figures against
 * the period before, test drives per day, the buyer funnel, the stock, and
 * interest per car with its CSV export in the header. The period lives in
 * the URL (?days=7|30|90), so the server renders the page for it.
 */
export default async function InsightsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const requested = Number((await searchParams).days);
  const days = (INSIGHT_PERIODS as readonly number[]).includes(requested) ? requested : 30;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("org.insights");
  const n = (value: number) => formatNumber(value, locale);
  const percent = (value: number) => formatNumber(value, locale, { style: "percent", maximumFractionDigits: 0 });
  const base = `/org/${slug}`;

  const result = await getInsights({ days });
  const data: Insights | null = result.success ? result.data : null;

  // The change against the period before, in words — never colour alone.
  const change = ({ value, previous }: { value: number; previous: number }) => {
    if (previous === 0) return value === 0 ? t("figures.same") : t("figures.fromZero");
    const ratio = (value - previous) / previous;
    if (Math.abs(ratio) < 0.005) return t("figures.same");
    return ratio > 0 ? t("figures.up", { percent: percent(ratio) }) : t("figures.down", { percent: percent(-ratio) });
  };

  return (
    <div className="flex flex-col gap-6">
      <OrgPageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={data && <ExportCsvButton cars={data.cars} days={days} />}
        className="mb-0 md:mb-0"
      />

      <PeriodSelect days={days} />

      {data && (
        <>
          <section aria-label={t("figures.label")}>
            <StatGrid
              columns={4}
              items={[
                { key: "requests", label: t("figures.requests"), value: n(data.figures.requests.value), note: change(data.figures.requests) },
                {
                  key: "completed",
                  label: t("figures.completed"),
                  value: n(data.figures.completed.value),
                  note:
                    data.figures.requests.value > 0
                      ? t("figures.completedNote", { percent: percent(data.figures.completed.value / data.figures.requests.value) })
                      : t("figures.completedNone"),
                },
                { key: "saves", label: t("figures.saves"), value: n(data.figures.saves.value), note: change(data.figures.saves) },
                { key: "questions", label: t("figures.questions"), value: n(data.figures.questions.value), note: change(data.figures.questions) },
              ]}
            />
          </section>

          <DrivesChart data={data.series} emptyLabel={t("chartEmpty")} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Panel title={t("funnel.title")} description={t("funnel.description")} className="lg:col-span-3" bodyClassName="gap-5">
              {(
                [
                  ["saved", data.funnel.saved, null],
                  ["requested", data.funnel.requested, data.funnel.saved],
                  ["drove", data.funnel.drove, data.funnel.requested],
                ] as const
              ).map(([key, value, before]) => {
                const top = Math.max(data.funnel.saved, data.funnel.requested, data.funnel.drove, 1);
                return (
                  <div key={key} className="grid grid-cols-1 gap-1.5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center sm:gap-4">
                    <span className="text-caption font-semibold">{t(`funnel.${key}`)}</span>
                    <div className="flex flex-col gap-1">
                      <span aria-hidden className="block h-3 rounded-e-[4px] bg-muted">
                        <span className="block h-full rounded-e-[4px] bg-[var(--chart-1)]" style={{ width: `${(value / top) * 100}%` }} />
                      </span>
                      <span className="text-caption">
                        <span className="font-semibold tabular-nums">{t("funnel.buyers", { count: value, value: n(value) })}</span>
                        {before !== null && before > 0 && (
                          <span className="text-muted-foreground"> {t("funnel.share", { percent: percent(value / before) })}</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </Panel>

            <Panel title={t("stock.title")} className="lg:col-span-2" bodyClassName="gap-4">
              <div
                role="img"
                aria-label={t("stock.label", { available: n(data.stock.AVAILABLE), sold: n(data.stock.SOLD), hidden: n(data.stock.UNAVAILABLE) })}
                className="flex h-5 gap-0.5 overflow-hidden rounded-[4px] bg-muted"
              >
                {(["AVAILABLE", "SOLD", "UNAVAILABLE"] as const).map((status) =>
                  data.stock[status] > 0 ? (
                    <span key={status} style={{ flexGrow: data.stock[status], background: CAR_STATUS_TONE[status].color }} />
                  ) : null,
                )}
              </div>
              <ul className="flex flex-col gap-2 text-caption">
                {(["AVAILABLE", "SOLD", "UNAVAILABLE"] as const).map((status) => (
                  <li key={status} className="flex items-center gap-2">
                    <span aria-hidden className="size-3 rounded-[3px]" style={{ background: CAR_STATUS_TONE[status].color }} />
                    {t(`stock.${status}`)}
                    <span className={cn("ms-auto font-semibold tabular-nums")}>{n(data.stock[status])}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <InsightsTable cars={data.cars} carsHref={`${base}/cars`} />
        </>
      )}
    </div>
  );
}
