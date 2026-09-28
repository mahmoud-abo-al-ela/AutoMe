"use client";

import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, EyeOff, Images, Loader2, ScanSearch, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCarPlanLimits } from "@/actions/cars";
import { useBulkImport, ImportError, type ImportGroup } from "@/hooks/use-bulk-import";
import { usePlanUsage } from "@/hooks/use-plan-usage";
import { useFormatters } from "@/hooks/use-formatters";
import { useActionError } from "@/hooks/use-action-error";
import { MAX_IMPORT_PHOTOS } from "@/lib/constants/car-options";
import { shrinkForAi } from "@/lib/utils/shrink-image";
import CarFormShared from "../car-forms/shared/CarFormShared";
import { ReviewGroups } from "./ReviewGroups";
import { DraftResults } from "./DraftResults";
import { ImportHeader } from "./ImportHeader";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** What makes a good batch, shown before the dealer picks photos. */
const TIPS = [
  { key: "many", icon: Images },
  { key: "badge", icon: ScanSearch },
  { key: "hidden", icon: EyeOff },
] as const;

/** How many more of a limited resource the plan allows; Infinity if unlimited. */
function left(usage: { current: number; limit: number } | null | undefined): number {
  if (!usage) return 0;
  return usage.limit === -1 ? Infinity : Math.max(0, usage.limit - usage.current);
}

/**
 * Bulk import: drop the photos of many cars at once, let the AI sort them
 * into cars, fix the sorting, choose which cars the AI drafts, and fill in
 * the rest by hand — each saved hidden, to review and publish.
 */
export default function BulkImport() {
  const t = useTranslations("org.carForm.import");
  const { number } = useFormatters();
  const actionError = useActionError();
  const { slug } = useParams<{ slug: string }>();
  const importer = useBulkImport();
  const { files, stage, groups, results, selected } = importer;
  const [error, setError] = useState<string | null>(null);
  const [maxImages, setMaxImages] = useState(5);
  /** A car being filled in by hand, with its photos ready for the form. */
  const [manual, setManual] = useState<{ groupId: number; images: File[] } | null>(null);
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

  // Cars the AI can still draft: the fewer of AI listings and car slots left.
  // Unknown until both usage reads answer — never read as "none left", which
  // flashed "no AI listings left" and disabled the button on every load.
  const known = Boolean(aiUsage && carUsage);
  const room = known ? Math.min(left(aiUsage), left(carUsage)) : Infinity;
  const noRoom = known && room === 0;

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
      await importer.group(accepted, room);
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

  /** Open the car form with this car's photos, shrunk to fit the upload limit. */
  const fillIn = async (group: ImportGroup) => {
    const images = await Promise.all(group.photos.slice(0, maxImages).map((i) => shrinkForAi(files[i])));
    setManual({ groupId: group.id, images });
  };

  const publishAll = async () => {
    const { published, total } = await importer.publishAll();
    if (published === total) toast.success(t("published", { count: published, n: number(published) }));
    else toast.error(t("publishPartial", { done: number(published), total: number(total) }));
  };

  if (manual) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <Button type="button" variant="ghost" onClick={() => setManual(null)}>
          <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" aria-hidden />
          {t("backToImport")}
        </Button>
        <CarFormShared
          initialData={{ images: manual.images }}
          onSaved={(car) => {
            importer.markSaved(manual.groupId, car.id);
            setManual(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <ImportHeader stage={stage} room={room} known={known} />

      {stage === "pick" && (
        <Card className="py-0">
          <CardContent className="space-y-5 p-5 sm:p-8">
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors hover:border-purple-400 hover:bg-purple-50/40 ${
                isDragActive ? "border-purple-500 bg-purple-50" : "border-gray-300"
              }`}
            >
              <input {...getInputProps()} />
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-50 to-indigo-100">
                <Images className="h-8 w-8 text-purple-600" aria-hidden />
              </div>
              <p className="mb-1 font-semibold text-gray-900">{isDragActive ? t("dropping") : t("dropPrompt")}</p>
              <p className="mb-5 text-sm text-gray-500">{t("formats", { max: number(MAX_IMPORT_PHOTOS) })}</p>
              <Button type="button" className="bg-purple-600 hover:bg-purple-700" disabled={noRoom}>
                <Upload className="me-2 h-4 w-4" aria-hidden />
                {t("choose")}
              </Button>
            </div>
            <ul className="grid gap-3 sm:grid-cols-3">
              {TIPS.map(({ key, icon: Icon }) => (
                <li key={key} className="flex items-start gap-2.5 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" aria-hidden />
                  {t(`tipsList.${key}`)}
                </li>
              ))}
            </ul>
            {noRoom && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">{t("noRoom")}</p>}
            {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
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
          {groups.length > room && (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              {t("overRoom", { room: number(room), total: number(groups.length) })}
            </p>
          )}
          <ReviewGroups
            groups={groups}
            previews={previews}
            selected={selected}
            room={room}
            onToggle={importer.toggleSelected}
            onMove={importer.movePhoto}
            onRemove={importer.removeGroup}
          />
          {/* Stays in reach at the bottom of the screen while the dealer
              scrolls a long batch of cars. */}
          {/* Start over at the reading start, create at the far end — right
              and left in Arabic, mirrored in English by the flex direction. */}
          <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border bg-white/95 p-3 shadow-lg backdrop-blur sm:p-4">
            <Button type="button" variant="outline" onClick={importer.reset}>
              {t("startOver")}
            </Button>
            <Button
              type="button"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={groups.length === 0}
              onClick={() => importer.createDrafts(maxImages)}
            >
              <Sparkles className="me-1.5 h-4 w-4" aria-hidden />
              {selected.size > 0
                ? t("create", { count: selected.size, n: number(selected.size) })
                : t("continueByHand")}
            </Button>
          </div>
        </>
      )}

      {(stage === "creating" || stage === "done") && (
        <DraftResults
          running={stage === "creating"}
          groups={groups}
          results={results}
          previews={previews}
          slug={slug}
          queued={importer.progress?.phase === "waiting"}
          onStop={importer.stop}
          onPublishAll={publishAll}
          onFillIn={fillIn}
          onAnother={importer.reset}
        />
      )}
    </div>
  );
}
