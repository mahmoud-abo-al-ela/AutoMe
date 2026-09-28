import { MAX_AI_LISTING_PHOTOS } from "@/lib/constants/car-options";

/**
 * A car in a bulk import, as the dealer arranges it. `photos` are positions
 * in the batch, in listing order — the first is the cover. `readWith` are the
 * photos the AI reads to identify the car.
 */
export interface ImportGroup {
  id: number;
  label: string;
  photos: number[];
  readWith: number[];
}

/**
 * The photos a car is read with: its chosen ones first, then its others until
 * the read is full — a photo held back may be the badge that names the car.
 */
function fullRead(chosen: number[], photos: number[]): number[] {
  return [...chosen, ...photos.filter((p) => !chosen.includes(p))].slice(0, MAX_AI_LISTING_PHOTOS);
}

/**
 * Place one photo: at position `at` of car `to` (its end when no position),
 * or in a car of its own (`to` null, with the id `newId` gives). Within its
 * own car this reorders. A car left with no photos is dropped, and one that
 * lost an identifying photo reads with its others instead.
 */
export function placePhoto(
  groups: ImportGroup[],
  photo: number,
  to: number | null,
  at: number | undefined,
  newId: () => number
): ImportGroup[] {
  const from = groups.find((g) => g.photos.includes(photo));
  if (!from) return groups;

  if (to === from.id) {
    if (at === undefined) return groups;
    const rest = from.photos.filter((p) => p !== photo);
    const photos = [...rest.slice(0, at), photo, ...rest.slice(at)];
    return groups.map((g) => (g.id === to ? { ...g, photos } : g));
  }

  const without = groups
    .map((g) => {
      if (g.id !== from.id) return g;
      const photos = g.photos.filter((p) => p !== photo);
      return { ...g, photos, readWith: fullRead(g.readWith.filter((p) => p !== photo), photos) };
    })
    .filter((g) => g.photos.length > 0);

  if (to === null) {
    return [...without, { id: newId(), label: "", photos: [photo], readWith: [photo] }];
  }
  return without.map((g) =>
    g.id === to
      ? {
          ...g,
          photos: at === undefined ? [...g.photos, photo] : [...g.photos.slice(0, at), photo, ...g.photos.slice(at)],
          // A photo moved in may be the rear badge the car needed.
          readWith: g.readWith.length < MAX_AI_LISTING_PHOTOS ? [...g.readWith, photo] : g.readWith,
        }
      : g
  );
}
