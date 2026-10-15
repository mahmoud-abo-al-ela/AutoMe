import * as storageService from "@/lib/services/storage";
import { ValidationError, logError } from "@/lib/utils/errors";

export interface EditedPhotos {
  /** Photos the car already has, by stored URL, in the order the edit lists them. */
  kept: string[];
  /** New uploads: files or data: URLs. */
  added: Array<File | string>;
  /** Stored photos the edit dropped. */
  removed: string[];
}

/**
 * Sort an edit's photo list against the car's stored photos. Every photo is
 * either one this car already has — by its stored URL — or a new upload. A URL
 * the car doesn't have (another listing's, another dealership's, anywhere on
 * the web) is refused, and the plan's photo limit counts kept and new
 * together. Pure: nothing is uploaded or deleted here.
 */
export function sortEditedPhotos(
  stored: string[] | null | undefined,
  images: Array<File | string>,
  maxImagesPerCar: number
): EditedPhotos {
  const storedSet = new Set(stored || []);
  const kept: string[] = [];
  const added: Array<File | string> = [];
  for (const image of images) {
    if (typeof image === "string" && storedSet.has(image)) {
      kept.push(image);
    } else if (image instanceof File || (typeof image === "string" && image.startsWith("data:image/"))) {
      added.push(image);
    } else {
      throw new ValidationError("A photo must be one of this car's or a new upload", "images", {
        key: "errors.upload.notThisCar",
      });
    }
  }

  if (kept.length + added.length > maxImagesPerCar) {
    throw new ValidationError(`Maximum of ${maxImagesPerCar} images allowed`, "images", {
      key: "errors.upload.tooMany",
      params: { max: maxImagesPerCar },
    });
  }

  const removed = (stored || []).filter((url) => !kept.includes(url));
  return { kept, added, removed };
}

/**
 * Photos uploaded for an edit whose write did not land. Best effort: the
 * write's own error is what the dealer needs to see, not a cleanup failure.
 */
export async function discardUploads(urls: string[], carId: string) {
  if (urls.length === 0) return;
  await storageService.deleteCarImages(urls, carId).catch((error: unknown) =>
    logError(`Could not delete the unsaved photos of car ${carId}`, error)
  );
}
