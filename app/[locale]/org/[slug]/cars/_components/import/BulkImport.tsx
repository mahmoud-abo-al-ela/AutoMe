"use client";

import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, CircleSlash, FileImage, Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getCarPlanLimits } from "@/actions/cars";
import { useBulkImport, ImportError, type DraftResult } from "@/hooks/use-bulk-import";
import { usePlanUsage } from "@/hooks/use-plan-usage";
import { useFormatters } from "@/hooks/use-formatters";
import { useActionError } from "@/hooks/use-action-error";
import { MAX_IMPORT_PHOTOS } from "@/lib/constants/car-options";
import { GroupCard } from "./GroupCard";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** How many more of a limited resource the plan allows; Infinity if unlimited. */
function left(usage: { current: number; limit: number } | null | undefined): number {
  if (!usage) return 0;
  return usage.limit === -1 ? Infinity : Math.max(0, usage.limit - usage.current);
}

/**
 * Bulk import: drop the photos of many cars at once, let the AI sort them
 * into cars, fix the sorting, and get a hidden draft for each car to review
 * and publish.
 */
export default function BulkImport() {
  const t = useTranslations("org.carForm.import");
  const { number } = useFormatters();
  const actionError = useActionError();
  const { slug } = useParams<{ slug: string }>();
  const importer = useBulkImport();
  const { files, stage, groups, results } = importer;
  const [error, setError] = useState<string | null>(null);
  const [maxImages, setMaxImages] = useState(5);
  const { usage: aiUsage } = usePlanUsage("aiProcessing");
  const { usage: carUsage } = usePlanUsage("cars");

  useEffect(() => {
    getCarPlanLimits().then((result) => {
      if (result?.success) setMaxImages(result.data.maxImagesPerCar);
    });
  }, []);

  // Previews of the dealer's own files; released when the batch changes.
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const room = Math.min(left(aiUsage), left(carUsage));

  const onDrop = async (accepted: File[]) => {
    setError(null);
    if (accepted.length === 0) return;
    if (accepted.length > MAX_IMPORT_PHOTOS) {
      setError(t("tooMany", { max: number(MAX_IMPORT_PHOTOS) }));
      return;
    }
    if (accepted.some((f) => !ACCEPTED.includes(f.type) || f.size > MAX_UPLOAD_BYTES)) {
      setError(t("badFile"));
      return;
    }
    try {
      await importer.group(accepted);
    } catch (err) {
      setError(actionError((err as ImportError).error, t("groupFailed")));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
    multiple: true,
    disabled: stage !== "pick",
  });

  const publishAll = async () => {
    const { published, total } = await importer.publishAll();
    if (published === total) toast.success(t("published", { count: published, n: number(published) }));
    else toast.error(t("publishPartial", { done: number(published), total: number(total) }));
  };

  const doneCount = Object.values(results).filter((r) => r.status === "done").length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-purple-600" aria-hidden />
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle", { max: number(MAX_IMPORT_PHOTOS) })}</p>
        {aiUsage && carUsage && (
          <p className="mt-2 text-sm text-purple-700">
            {room === Infinity ? t("roomUnlimited") : t("room", { count: room, n: number(room) })}
          </p>
        )}
      </div>

      {stage === "pick" && (
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-10 text-center transition-colors hover:border-purple-400 ${
                isDragActive ? "border-purple-400 bg-purple-50" : "border-gray-300"
              }`}
            >
              <input {...getInputProps()} />
              <FileImage className="mx-auto mb-4 h-10 w-10 text-purple-600" aria-hidden />
              <p className="mb-4 text-gray-700">{t("dropPrompt")}</p>
              <Button type="button" className="bg-purple-600 hover:bg-purple-700" disabled={room === 0}>
                <Upload className="me-2 h-4 w-4" aria-hidden />
                {t("choose")}
              </Button>
              <p className="mt-3 text-xs text-gray-500">{t("tips")}</p>
            </div>
            {room === 0 && <p className="mt-4 text-sm text-amber-700">{t("noRoom")}</p>}
            {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          </CardContent>
        </Card>
      )}

      {stage === "grouping" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" aria-hidden />
            <p className="font-medium">{t("grouping", { n: number(files.length) })}</p>
            <p className="text-sm text-gray-500">{t("groupingNote")}</p>
          </CardContent>
        </Card>
      )}

      {stage === "review" && (
        <>
          <p className="text-sm text-gray-600">{t("reviewIntro", { count: groups.length, n: number(groups.length) })}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((group, index) => (
              <GroupCard
                key={group.id}
                group={group}
                index={index}
                groups={groups}
                previews={previews}
                onMove={importer.movePhoto}
                onRemove={() => importer.removeGroup(group.id)}
              />
            ))}
          </div>
          {groups.length > room && (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              {t("overRoom", { room: number(room), total: number(groups.length) })}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={groups.length === 0 || room === 0}
              onClick={() => importer.createDrafts(room, maxImages)}
            >
              {t("create", { count: Math.min(groups.length, room), n: number(Math.min(groups.length, room)) })}
            </Button>
            <Button type="button" variant="outline" onClick={importer.reset}>
              {t("startOver")}
            </Button>
          </div>
        </>
      )}

      {(stage === "creating" || stage === "done") && (
        <>
          <ol className="divide-y rounded-lg border bg-white">
            {groups.map((group, index) => (
              <DraftRow
                key={group.id}
                index={index}
                label={group.label}
                result={results[group.id]}
                preview={previews[group.readWith[0] ?? group.photos[0]]}
                slug={slug}
                reading={stage === "creating" && results[group.id]?.status === "reading" ? importer.progress?.phase : undefined}
              />
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-3">
            {stage === "creating" ? (
              <Button type="button" variant="outline" onClick={importer.stop}>
                {t("stop")}
              </Button>
            ) : (
              <>
                <p className="text-sm text-gray-700">{t("summary", { count: doneCount, n: number(doneCount) })}</p>
                {doneCount > 0 && (
                  <Button type="button" className="bg-purple-600 hover:bg-purple-700" onClick={publishAll}>
                    {t("publishAll")}
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={importer.reset}>
                  {t("another")}
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** One car's progress through read → save, then a link to review it. */
function DraftRow({
  index,
  label,
  result,
  preview,
  slug,
  reading,
}: {
  index: number;
  label: string;
  result: DraftResult | undefined;
  preview: string;
  slug: string;
  reading?: string;
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
          {status === "reading" && reading === "waiting" ? t("status.queued") : t(`status.${status}`)}
          {status === "failed" && `: ${actionError(result?.error, t("saveFailed"))}`}
        </p>
      </div>
      {status === "done" && result?.carId && (
        <Link href={`/org/${slug}/cars/${result.carId}/edit`} className="text-sm font-medium text-purple-700 hover:underline">
          {t("review")}
        </Link>
      )}
      {(status === "reading" || status === "saving") && <Loader2 className="h-4 w-4 animate-spin text-purple-600" aria-hidden />}
      {status === "done" && <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />}
      {status === "failed" && <AlertCircle className="h-4 w-4 text-red-600" aria-hidden />}
      {status === "skipped" && <CircleSlash className="h-4 w-4 text-gray-400" aria-hidden />}
    </li>
  );
}
