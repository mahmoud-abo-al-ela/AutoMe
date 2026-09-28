"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import type { ImportGroup } from "@/hooks/use-bulk-import";
import { GroupCard, NewCarDropZone, PhotoThumb, type CarDrop, type PhotoDrag } from "./GroupCard";

/**
 * The cars the AI found, for the dealer to correct before anything is saved:
 * drag a photo to another car or to a new one, tick which cars to draft with
 * AI, leave a car out.
 *
 * dnd-kit rather than the browser's drag and drop, which does nothing on a
 * phone and nothing from a keyboard. A drag starts only after the pointer
 * moves (or a touch is held), so a tap still reaches the menu under a photo.
 */
export function ReviewGroups({
  groups,
  previews,
  selected,
  room,
  onToggle,
  onMove,
  onRemove,
}: {
  groups: ImportGroup[];
  previews: string[];
  selected: Set<number>;
  /** Cars that can still be drafted with AI this month. */
  room: number;
  onToggle: (id: number) => void;
  onMove: (photo: number, to: number | null) => void;
  onRemove: (id: number) => void;
}) {
  const t = useTranslations("org.carForm.import");
  const { number } = useFormatters();
  const [dragging, setDragging] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const carName = (groupId: number | null | undefined) => {
    if (groupId === null || groupId === undefined) return t("newCar");
    const index = groups.findIndex((g) => g.id === groupId);
    return t("carNumber", { n: number(index + 1) });
  };

  // Screen-reader narration in the page's language, not dnd-kit's English.
  const announcements: Announcements = {
    onDragStart: () => t("a11y.picked"),
    onDragOver: ({ over }) => (over ? t("a11y.over", { car: carName((over.data.current as CarDrop).groupId) }) : t("a11y.nowhere")),
    onDragEnd: ({ over }) => (over ? t("a11y.dropped", { car: carName((over.data.current as CarDrop).groupId) }) : t("a11y.cancelled")),
    onDragCancel: () => t("a11y.cancelled"),
  };

  const onDragStart = ({ active }: DragStartEvent) => setDragging((active.data.current as PhotoDrag).photo);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    if (!over) return;
    const { photo } = active.data.current as PhotoDrag;
    const { groupId } = over.data.current as CarDrop;
    const from = groups.find((g) => g.photos.includes(photo));
    if (from && from.id === groupId) return;
    onMove(photo, groupId);
  };

  const draggingFrom = dragging === null ? undefined : groups.find((g) => g.photos.includes(dragging));

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
      accessibility={{ announcements, screenReaderInstructions: { draggable: t("a11y.instructions") } }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group, index) => (
          <GroupCard
            key={group.id}
            group={group}
            index={index}
            groups={groups}
            previews={previews}
            selected={selected.has(group.id)}
            canSelect={selected.size < room}
            onToggle={() => onToggle(group.id)}
            onMove={onMove}
            onRemove={() => onRemove(group.id)}
          />
        ))}
        <NewCarDropZone />
      </div>
      <DragOverlay>
        {dragging !== null && (
          <div className="relative aspect-square w-24 overflow-hidden rounded-md shadow-xl ring-2 ring-purple-400">
            <PhotoThumb src={previews[dragging]} identifies={Boolean(draggingFrom?.readWith.includes(dragging))} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
