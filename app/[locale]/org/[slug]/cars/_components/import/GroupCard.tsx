"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import { GripVertical, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import type { ImportGroup } from "@/hooks/use-bulk-import";

/** Drag data: which photo. Drop data: which car, or a new one. */
export type PhotoDrag = { photo: number };
export type CarDrop = { groupId: number | null };

/**
 * One car the AI found in the batch. Photos are dragged between cars when the
 * sorting is wrong — two white Elantras are the case it gets wrong — with
 * mouse, touch or keyboard (dnd-kit), and reordered within a car — the first
 * photo is the cover. The menu under each photo moves it between cars
 * without dragging.
 */
export function GroupCard({
  group,
  index,
  groups,
  previews,
  selected,
  canSelect,
  onToggle,
  onMove,
  onRemove,
}: {
  group: ImportGroup;
  index: number;
  groups: ImportGroup[];
  /** Object URLs of the batch's photos, by position. */
  previews: string[];
  /** Drafted with AI when the import runs. */
  selected: boolean;
  /** False once the plan's room is taken by other selected cars. */
  canSelect: boolean;
  onToggle: () => void;
  onMove: (photo: number, to: number | null) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("org.carForm.import");
  const { number } = useFormatters();
  const { setNodeRef, isOver } = useDroppable({ id: `car-${group.id}`, data: { groupId: group.id } satisfies CarDrop });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 bg-white p-3 transition-colors sm:p-4 ${
        isOver ? "border-purple-400 bg-purple-50" : selected ? "border-purple-200" : "border-gray-200"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">
            {t("carNumber", { n: number(index + 1) })}
            {group.label && (
              <span className="font-normal text-gray-600">
                {" · "}
                <bdi>{group.label}</bdi>
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500">{t("photoCount", { count: group.photos.length, n: number(group.photos.length) })}</p>
          <label className={`mt-2 flex items-center gap-2 text-sm ${canSelect || selected ? "text-gray-800" : "text-gray-400"}`}>
            <input
              type="checkbox"
              checked={selected}
              disabled={!selected && !canSelect}
              onChange={onToggle}
              className="h-4 w-4 accent-purple-600"
            />
            {t("draftWithAi")}
          </label>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label={t("removeCar")} title={t("removeCar")}>
          <Trash2 className="h-4 w-4 text-gray-500" aria-hidden />
        </Button>
      </div>

      <SortableContext items={group.photos.map(photoId)} strategy={rectSortingStrategy}>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {group.photos.map((photo, position) => (
            <li key={photo} className="space-y-1">
              <SortablePhoto
                photo={photo}
                src={previews[photo]}
                identifies={group.readWith.includes(photo)}
                cover={position === 0}
              />
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
      </SortableContext>
    </div>
  );
}

/** A photo's dnd-kit id. Photo numbers are unique across the batch. */
export const photoId = (photo: number) => `photo-${photo}`;

/**
 * A photo that can be dragged within its car, to change the listing's order,
 * or to another car. Hidden in place while dragging: the overlay carries it.
 */
function SortablePhoto({
  photo,
  src,
  identifies,
  cover,
}: {
  photo: number;
  src: string;
  identifies: boolean;
  cover: boolean;
}) {
  const t = useTranslations("org.carForm.import");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photoId(photo),
    data: { photo } satisfies PhotoDrag,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={t("dragPhoto")}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`relative aspect-square cursor-grab touch-none overflow-hidden rounded-md bg-gray-100 outline-offset-2 focus-visible:outline-2 focus-visible:outline-purple-500 active:cursor-grabbing ${
        isDragging ? "opacity-30" : ""
      }`}
    >
      <PhotoThumb src={src} identifies={identifies} cover={cover} />
    </div>
  );
}

/** The thumbnail itself, shared by the card and the drag overlay. */
export function PhotoThumb({ src, identifies, cover = false }: { src: string; identifies: boolean; cover?: boolean }) {
  const t = useTranslations("org.carForm.import");
  return (
    <>
      {/* A blob: URL for a file still on the dealer's device — next/image
          cannot optimize one. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" draggable={false} className="h-full w-full object-cover" />
      <GripVertical className="absolute bottom-1 end-1 h-4 w-4 rounded bg-white/80 text-gray-600" aria-hidden />
      {identifies && (
        <span className="absolute top-1 start-1 rounded-full bg-purple-600 p-1 text-white" title={t("identifies")}>
          <Star className="h-3 w-3" aria-hidden />
          <span className="sr-only">{t("identifies")}</span>
        </span>
      )}
      {cover && (
        <span className="absolute bottom-1 start-1 rounded bg-gray-900/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {t("cover")}
        </span>
      )}
    </>
  );
}

/** Drop a photo here to make it a car of its own. */
export function NewCarDropZone() {
  const t = useTranslations("org.carForm.import");
  const { setNodeRef, isOver } = useDroppable({ id: "new-car", data: { groupId: null } satisfies CarDrop });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-24 items-center justify-center rounded-lg border-2 border-dashed p-4 text-center text-sm transition-colors ${
        isOver ? "border-purple-400 bg-purple-50 text-purple-700" : "border-gray-300 text-gray-500"
      }`}
    >
      {t("dropNewCar")}
    </div>
  );
}
