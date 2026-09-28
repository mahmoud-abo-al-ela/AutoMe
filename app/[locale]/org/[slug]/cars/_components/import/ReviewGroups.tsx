"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import type { ImportGroup } from "@/hooks/use-bulk-import";
import { GroupCard, NewCarDropZone, PhotoThumb, type CarDrop, type PhotoDrag } from "./GroupCard";

/**
 * A photo under the pointer beats the car card around it: dropping on a photo
 * means "put it here", in that car and at that place. Keyboard and touch drags
 * with nothing under a pointer fall back to the nearest target.
 */
const photoFirst: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  const photos = hits.filter((hit) => String(hit.id).startsWith("photo-"));
  if (photos.length > 0) return photos;
  return hits.length > 0 ? hits : closestCenter(args);
};

/**
 * The cars the AI found, for the dealer to correct before anything is saved:
 * drag a photo to another car or a new one, or to another place in its own
 * car (the first is the cover), tick which cars to draft with
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
  onMove: (photo: number, to: number | null, at?: number) => void;
  onRemove: (id: number) => void;
}) {
  const t = useTranslations("org.carForm.import");
  const { number } = useFormatters();
  const [dragging, setDragging] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const carName = (groupId: number | null | undefined) => {
    if (groupId === null || groupId === undefined) return t("newCar");
    const index = groups.findIndex((g) => g.id === groupId);
    return t("carNumber", { n: number(index + 1) });
  };

  /**
   * Where a drop lands. On a photo: that photo's car, at its place — so a
   * photo dropped on the cover becomes the cover. On a car card: the end of
   * that car. On "a new car": a car of its own.
   */
  const target = (data: unknown): { groupId: number | null; at?: number } => {
    if (data && typeof data === "object" && "photo" in data) {
      const onPhoto = (data as PhotoDrag).photo;
      const car = groups.find((g) => g.photos.includes(onPhoto));
      if (car) return { groupId: car.id, at: car.photos.indexOf(onPhoto) };
    }
    return { groupId: (data as CarDrop).groupId };
  };

  const narrate = (data: unknown, withPlace: string, withoutPlace: string) => {
    const { groupId, at } = target(data);
    return at === undefined
      ? t(withoutPlace, { car: carName(groupId) })
      : t(withPlace, { car: carName(groupId), place: number(at + 1) });
  };

  // Screen-reader narration in the page's language, not dnd-kit's English.
  const announcements: Announcements = {
    onDragStart: () => t("a11y.picked"),
    onDragOver: ({ over }) => (over ? narrate(over.data.current, "a11y.overPlace", "a11y.over") : t("a11y.nowhere")),
    onDragEnd: ({ over }) => (over ? narrate(over.data.current, "a11y.droppedPlace", "a11y.dropped") : t("a11y.cancelled")),
    onDragCancel: () => t("a11y.cancelled"),
  };

  const onDragStart = ({ active }: DragStartEvent) => setDragging((active.data.current as PhotoDrag).photo);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    if (!over || over.id === active.id) return;
    const { photo } = active.data.current as PhotoDrag;
    const { groupId, at } = target(over.data.current);
    const from = groups.find((g) => g.photos.includes(photo));
    // Onto its own car's card, not a photo in it: nothing to change.
    if (from && from.id === groupId && at === undefined) return;
    onMove(photo, groupId, at);
  };

  const draggingFrom = dragging === null ? undefined : groups.find((g) => g.photos.includes(dragging));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={photoFirst}
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
