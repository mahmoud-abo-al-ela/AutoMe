"use client";

import { useTranslations } from "next-intl";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import type { ImportGroup } from "@/hooks/use-bulk-import";

/**
 * One car the AI found in the batch. Each photo can be moved to another car,
 * or to a car of its own, when the sorting is wrong — two white Elantras are
 * the case it gets wrong.
 */
export function GroupCard({
  group,
  index,
  groups,
  previews,
  onMove,
  onRemove,
}: {
  group: ImportGroup;
  index: number;
  groups: ImportGroup[];
  /** Object URLs of the batch's photos, by position. */
  previews: string[];
  onMove: (photo: number, to: number | null) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("org.carForm.import");
  const { number } = useFormatters();

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">
            {t("carNumber", { n: number(index + 1) })}
            {group.label && <span className="font-normal text-gray-600"> · <bdi>{group.label}</bdi></span>}
          </p>
          <p className="text-xs text-gray-500">{t("photoCount", { count: group.photos.length, n: number(group.photos.length) })}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label={t("removeCar")} title={t("removeCar")}>
          <Trash2 className="h-4 w-4 text-gray-500" aria-hidden />
        </Button>
      </div>

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {group.photos.map((photo) => (
          <li key={photo} className="space-y-1">
            <div className="relative aspect-square overflow-hidden rounded-md bg-gray-100">
              {/* A blob: URL for a file still on the dealer's device —
                  next/image cannot optimize one. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previews[photo]} alt="" className="h-full w-full object-cover" />
              {group.readWith.includes(photo) && (
                <span
                  className="absolute top-1 start-1 rounded-full bg-purple-600 p-1 text-white"
                  title={t("identifies")}
                >
                  <Star className="h-3 w-3" aria-hidden />
                  <span className="sr-only">{t("identifies")}</span>
                </span>
              )}
            </div>
            <select
              aria-label={t("moveTo")}
              value={group.id}
              onChange={(event) => {
                const value = event.target.value;
                onMove(photo, value === "new" ? null : Number(value));
              }}
              className="w-full rounded border border-gray-200 bg-white px-1 py-0.5 text-xs text-gray-700"
            >
              {groups.map((other, i) => (
                <option key={other.id} value={other.id}>
                  {t("carNumber", { n: number(i + 1) })}
                </option>
              ))}
              <option value="new">{t("newCar")}</option>
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}
