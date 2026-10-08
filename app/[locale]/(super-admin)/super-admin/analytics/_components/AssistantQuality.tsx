"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import type { AnalyticsData } from "@/lib/services/super-admin/analytics";
import { Change, Panel, Stat, link, td, th, usePercent } from "./report-parts";

type Assistant = Extract<AnalyticsData, { report: "ai" }>["assistant"];

const empty = "px-5 py-8 text-center text-caption text-muted-foreground";

/**
 * The listing assistant on the AI report: what it did with buyers' questions,
 * how buyers rated its answers, and which model and prompt wrote the answers
 * they did not find helpful — so a 👎 traces to the call behind it.
 */
export function AssistantQuality({ data }: { data: Assistant }) {
  const t = useTranslations("superAdmin.analytics.ai.assistant");
  const fmt = useFormatters();
  const percent = usePercent();
  const n = (value: number) => fmt.number(value);
  const total = data.replies.current;
  const rated = data.ratings.helpful + data.ratings.unhelpful;

  return (
    <section aria-labelledby="assistant-quality" className="flex flex-col gap-5">
      <h2 id="assistant-quality" className="pt-2 text-body font-semibold">
        {t("title")}
      </h2>

      {total === 0 ? (
        <p className={cn(empty, "rounded-[20px] border border-border bg-card py-12")}>{t("noAnswers")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={t("replies")} value={n(total)} note={<Change pair={data.replies} />} />
            <Stat
              label={t("answered")}
              value={percent(data.answered, total)}
              note={<span className="text-micro text-muted-foreground">{t("answeredOf", { count: n(data.answered) })}</span>}
            />
            <Stat
              label={t("declined")}
              value={percent(data.declined, total)}
              note={<span className="text-micro text-muted-foreground">{t("offTopicNote", { count: n(data.offTopic) })}</span>}
            />
            <Stat
              label={t("helpful")}
              value={percent(data.ratings.helpful, rated)}
              note={<span className="text-micro text-muted-foreground">{t("ratedOf", { count: n(rated) })}</span>}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel title={t("byModel")} note={t("byModelNote")}>
              {data.byModel.length === 0 ? (
                <p className={empty}>{t("noAnswers")}</p>
              ) : (
                <div className="relative overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-caption">
                    <thead>
                      <tr className="whitespace-nowrap border-b border-border bg-muted/60 text-muted-foreground">
                        {(["model", "prompt", "answers", "rated", "helpful"] as const).map((key) => (
                          <th key={key} scope="col" className={cn(th, key === "helpful" && "pe-5")}>
                            {t(`columns.${key}`)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.byModel.map((row) => (
                        <tr key={`${row.model}|${row.promptVersion}`} className="border-b border-border last:border-b-0">
                          <td className={td}>
                            {row.model ? (
                              <bdi dir="ltr" className="font-mono text-micro">
                                {row.model}
                              </bdi>
                            ) : (
                              <span className="text-muted-foreground">{t("untracked")}</span>
                            )}
                          </td>
                          <td className={td}>
                            <bdi dir="ltr" className="font-mono text-micro">
                              {row.promptVersion ?? "—"}
                            </bdi>
                          </td>
                          <td className={td}>{n(row.answers)}</td>
                          <td className={td}>{n(row.rated)}</td>
                          <td className={cn(td, "pe-5")}>{percent(row.helpful, row.rated)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel title={t("unhelpful")}>
              {data.unhelpful.length === 0 ? (
                <p className={empty}>{t("noUnhelpful")}</p>
              ) : (
                <ul>
                  {data.unhelpful.map((row) => (
                    <li key={row.id} className="flex flex-col gap-1 border-b border-border px-5 py-3.5 last:border-b-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="min-w-0 text-caption font-semibold">
                          <span className="sr-only">{t("asked")}: </span>
                          <bdi>{row.question}</bdi>
                        </p>
                        <Link href={`/cars/${row.carId}`} className={cn(link, "shrink-0 text-micro")}>
                          {t("viewCar")}
                        </Link>
                      </div>
                      <p className="text-caption text-muted-foreground">
                        <span className="sr-only">{t("answer")}: </span>
                        <bdi>{row.answer || t("fixedCopy")}</bdi>
                      </p>
                      <p className="flex flex-wrap gap-x-2 text-micro text-muted-foreground">
                        <span>{row.dealership}</span>
                        <span aria-hidden>·</span>
                        <bdi dir="ltr" className="font-mono">
                          {row.model ?? t("untracked")}
                        </bdi>
                        {row.promptVersion && (
                          <>
                            <span aria-hidden>·</span>
                            <bdi dir="ltr" className="font-mono">
                              {row.promptVersion}
                            </bdi>
                          </>
                        )}
                        {row.ratedAt && (
                          <>
                            <span aria-hidden>·</span>
                            <span>{fmt.relativeToNow(row.ratedAt, { addSuffix: true })}</span>
                          </>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </section>
  );
}
