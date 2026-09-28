"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, CircleSlash, Globe, Loader2, Plus, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFormatters } from "@/hooks/use-formatters";
import type { DraftResult, ImportGroup } from "@/hooks/use-bulk-import";
import { DraftRow } from "./DraftRow";

/**
 * The drafts step. While cars are being read and saved: how far along, and a
 * way to stop. After: what came of each car, what needs the dealer, and the
 * one action most of them want next — publish.
 */
export function DraftResults({
  running,
  groups,
  results,
  previews,
  slug,
  queued,
  onStop,
  onPublishAll,
  onFillIn,
  onAnother,
}: {
  running: boolean;
  groups: ImportGroup[];
  results: Record<number, DraftResult>;
  previews: string[];
  slug: string;
  queued: boolean;
  onStop: () => void;
  onPublishAll: () => Promise<void>;
  onFillIn: (group: ImportGroup) => void;
  onAnother: () => void;
}) {
  const t = useTranslations("org.carForm.import");
  const { number } = useFormatters();
  const [publishing, setPublishing] = useState(false);

  const all = groups.map((g) => results[g.id]);
  const saved = all.filter((r) => r?.status === "done");
  const unpublished = saved.filter((r) => !r?.published).length;
  const published = saved.length - unpublished;
  const failed = all.filter((r) => r?.status === "failed").length;
  const skipped = all.filter((r) => r?.status === "skipped").length;
  const toDraft = all.filter((r) => r && r.status !== "skipped").length;
  const finished = all.filter((r) => r && (r.status === "done" || r.status === "failed")).length;

  const publish = async () => {
    setPublishing(true);
    try {
      await onPublishAll();
    } finally {
      setPublishing(false);
    }
  };

  const stats = [
    { show: unpublished > 0, icon: CheckCircle2, tone: "text-green-700 bg-green-50", text: t("stats.saved", { n: number(unpublished) }) },
    { show: published > 0, icon: Globe, tone: "text-emerald-700 bg-emerald-50", text: t("stats.published", { n: number(published) }) },
    { show: failed > 0, icon: AlertCircle, tone: "text-red-700 bg-red-50", text: t("stats.failed", { n: number(failed) }) },
    { show: skipped > 0, icon: CircleSlash, tone: "text-gray-700 bg-gray-100", text: t("stats.skipped", { n: number(skipped) }) },
  ].filter((s) => s.show);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        {running ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-medium text-gray-900">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" aria-hidden />
                {t("progress", { done: number(Math.min(finished + 1, toDraft)), total: number(toDraft) })}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={onStop}>
                <Square className="me-1.5 h-3.5 w-3.5" aria-hidden />
                {t("stop")}
              </Button>
            </div>
            <Progress value={toDraft > 0 ? (finished / toDraft) * 100 : 0} aria-label={t("steps.drafts")} />
            <p className="text-xs text-gray-500">{t("progressNote")}</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2" aria-live="polite">
              {stats.map(({ icon: Icon, tone, text }) => (
                <span key={text} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${tone}`}>
                  <Icon className="h-4 w-4" aria-hidden />
                  {text}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {unpublished > 0 && (
                <Button type="button" className="bg-purple-600 hover:bg-purple-700" onClick={publish} disabled={publishing}>
                  {publishing ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" aria-hidden /> : <Globe className="me-1.5 h-4 w-4" aria-hidden />}
                  {t("publishAllCount", { n: number(unpublished) })}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onAnother}>
                <Plus className="me-1.5 h-4 w-4" aria-hidden />
                {t("another")}
              </Button>
            </div>
          </div>
        )}
        {!running && unpublished > 0 && <p className="mt-3 text-xs text-gray-500">{t("hiddenNote")}</p>}
      </div>

      <ol className="divide-y overflow-hidden rounded-xl border bg-white shadow-sm">
        {groups.map((group, index) => (
          <DraftRow
            key={group.id}
            index={index}
            label={group.label}
            result={results[group.id]}
            preview={previews[group.photos[0]]}
            photoCount={group.photos.length}
            slug={slug}
            queued={queued}
            canFillIn={!running}
            onFillIn={() => onFillIn(group)}
          />
        ))}
      </ol>
    </section>
  );
}
