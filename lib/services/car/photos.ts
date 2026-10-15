import * as storageService from "@/lib/services/storage";
import { ValidationError, logError } from "@/lib/utils/errors";

export interface EditedPhotos {
  kept: string[];
  added: Array<File | string>;
  removed: string[];
}

/** A URL the car doesn't already have is refused, so an edit can't attach another listing's photo. */
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

/** Best effort: the failed write's error is what the dealer should see, not this one's. */
export async function discardUploads(urls: string[], carId: string) {
  if (urls.length === 0) return;
  await storageService.deleteCarImages(urls, carId).catch((error: unknown) =>
    logError(`Could not delete the unsaved photos of car ${carId}`, error)
  );
}
