"use client";

import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, CircleSlash, Loader2, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useFormatters } from "@/hooks/use-formatters";
import { useActionError } from "@/hooks/use-action-error";
import type { DraftResult } from "@/hooks/use-bulk-import";

/**
 * One car's progress through read → save, then a link to review it. A car
 * not drafted with AI — not chosen, or its read failed — offers the car form
 * with its photos already in it, so no photo is lost.
 */
export function DraftRow({
  index,
  label,
  result,
  preview,
  slug,
  queued,
  canFillIn,
  onFillIn,
}: {
  index: number;
  label: string;
  result: DraftResult | undefined;
  preview: string;
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

  return (
    <li className="flex items-center gap-3 p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={preview} alt="" className="h-12 w-16 shrink-0 rounded object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">
          {result?.title ?? (label || t("carNumber", { n: number(index + 1) }))}
        </p>
        <p className="text-xs text-gray-500">
          {status === "reading" && queued ? t("status.queued") : t(`status.${status}`)}
          {status === "failed" && `: ${actionError(result?.error, t("saveFailed"))}`}
        </p>
      </div>
      {status === "done" && result?.carId && (
        <Link href={`/org/${slug}/cars/${result.carId}/edit`} className="text-sm font-medium text-purple-700 hover:underline">
          {t("review")}
        </Link>
      )}
      {(status === "skipped" || status === "failed") && canFillIn && (
        <Button type="button" variant="outline" size="sm" onClick={onFillIn}>
          <PencilLine className="me-1.5 h-4 w-4" aria-hidden />
          {t("fillIn")}
        </Button>
      )}
      {(status === "reading" || status === "saving") && <Loader2 className="h-4 w-4 animate-spin text-purple-600" aria-hidden />}
      {status === "done" && <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />}
      {status === "failed" && <AlertCircle className="h-4 w-4 text-red-600" aria-hidden />}
      {status === "skipped" && <CircleSlash className="h-4 w-4 text-gray-400" aria-hidden />}
    </li>
  );
}
