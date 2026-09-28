"use client";

import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, CircleSlash, ExternalLink, Globe, Loader2, PencilLine, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useFormatters } from "@/hooks/use-formatters";
import { useActionError } from "@/hooks/use-action-error";
import type { DraftResult } from "@/hooks/use-bulk-import";

/** "green Aeolus Mage" → "Green Aeolus Mage"; Arabic has no case and is left alone. */
const sentenceCase = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1);

const TONE = {
  working: "bg-purple-50 text-purple-700",
  ok: "bg-green-50 text-green-700",
  live: "bg-emerald-600 text-white",
  bad: "bg-red-50 text-red-700",
  idle: "bg-gray-100 text-gray-600",
} as const;

/**
 * One car's journey through the import: reading, saving, a hidden draft to
 * review, and — once published — a live listing. A car not drafted with AI
 * (not chosen, or its read failed) offers the car form with its photos
 * already in it, so no photo is lost.
 */
export function DraftRow({
  index,
  label,
  result,
  preview,
  photoCount,
  slug,
  queued,
  canFillIn,
  onFillIn,
}: {
  index: number;
  label: string;
  result: DraftResult | undefined;
  preview: string;
  photoCount: number;
  slug: string;
  /** The read has not started: the AI service is queueing it. */
  queued: boolean;
  /** False while the import is still running. */
  canFillIn: boolean;
  onFillIn: () => void;
}) {
  const t = useTranslations("org.carForm.import");
  const { number } = useFormatters();
  const actionError = useActionError();
  const status = result?.status ?? "waiting";
  const busy = status === "reading" || status === "saving";

  const badge =
    result?.published
      ? { tone: TONE.live, icon: Globe, text: t("status.published") }
      : status === "done"
        ? { tone: TONE.ok, icon: CheckCircle2, text: t("status.done") }
        : status === "failed"
          ? { tone: TONE.bad, icon: AlertCircle, text: t("status.failed") }
          : status === "skipped"
            ? { tone: TONE.idle, icon: CircleSlash, text: t("status.skipped") }
            : busy
              ? { tone: TONE.working, icon: Loader2, text: status === "reading" && queued ? t("status.queued") : t(`status.${status}`) }
              : { tone: TONE.idle, icon: null, text: t("status.waiting") };
  const BadgeIcon = badge.icon;

  return (
    <li
      className={`flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4 ${
        status === "failed" ? "bg-red-50/40" : busy ? "bg-purple-50/40" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover ring-1 ring-gray-200" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate font-semibold text-gray-900">
            <bdi>{result?.title ?? (label ? sentenceCase(label) : t("carNumber", { n: number(index + 1) }))}</bdi>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.tone}`}>
              {BadgeIcon && <BadgeIcon className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} aria-hidden />}
              {badge.text}
            </span>
            <span className="text-xs text-gray-500">{t("photoCount", { count: photoCount, n: number(photoCount) })}</span>
          </div>
          {status === "failed" && (
            <p className="text-xs text-red-700">{actionError(result?.error, t("saveFailed"))}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
        {status === "done" && result?.carId && result.published && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/cars/${result.carId}`} target="_blank">
              <ExternalLink className="me-1.5 h-4 w-4 rtl:-scale-x-100" aria-hidden />
              {t("view")}
            </Link>
          </Button>
        )}
        {/* Review opens in a new tab: leaving this page would lose the import. */}
        {status === "done" && result?.carId && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/org/${slug}/cars/${result.carId}/edit`} target="_blank">
              <SquarePen className="me-1.5 h-4 w-4" aria-hidden />
              {t("review")}
            </Link>
          </Button>
        )}
        {(status === "skipped" || status === "failed") && canFillIn && (
          <Button type="button" size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={onFillIn}>
            <PencilLine className="me-1.5 h-4 w-4" aria-hidden />
            {t("fillIn")}
          </Button>
        )}
      </div>
    </li>
  );
}
