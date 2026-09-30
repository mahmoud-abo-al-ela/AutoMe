import type { AiCallerContext } from "@/lib/ai/client";
import { describeCarImages, type PhotoToDescribe } from "@/lib/services/ai/describeCarImages";
import { parseImageAlts, type ImageAlts } from "@/lib/utils/image-alts";
import * as carRepository from "@/lib/repositories/car";
import { logError } from "@/lib/utils/errors";

/**
 * Keeping a car's photo alt text in step with its photos.
 *
 * The pure half (what needs describing, how the reply merges) is separate from
 * the I/O half so it can be tested without a model or a database — the part
 * that matters is that alt text survives a reorder and a deletion, and that is
 * all in the merge.
 */

/** Photos the car shows that have no alt text yet, in display order. */
export function undescribedImages(images: string[], alts: ImageAlts): string[] {
  return images.filter((url) => !alts[url]);
}

/**
 * The alt text to store: every current photo's existing or new description,
 * and nothing for a photo the car no longer has. Order-independent by
 * construction — it is keyed by URL.
 */
export function mergeImageAlts(images: string[], existing: ImageAlts, described: ImageAlts): ImageAlts {
  const merged: ImageAlts = {};
  for (const url of images) {
    const alt = described[url] ?? existing[url];
    if (alt) merged[url] = alt;
  }
  return merged;
}

/** Whether two alt maps hold the same entries — to skip a no-op write. */
function sameAlts(a: ImageAlts, b: ImageAlts): boolean {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((k) => b[k] && b[k].en === a[k].en && b[k].ar === a[k].ar)
  );
}

/**
 * Only our own storage is ever fetched. The URLs come from the database, but
 * the server fetching an arbitrary URL is how SSRF starts, so the origin is
 * checked rather than assumed.
 */
function isOwnCarImage(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!base && url.startsWith(`${base}/storage/v1/object/public/car-images/`);
}

/**
 * Inline images share one request, which Gemini caps at 20 MB. Photos are added
 * in order until this is reached; the rest stay undescribed and are picked up
 * on a later save.
 */
const MAX_REQUEST_BYTES = 12 * 1024 * 1024;
const MAX_PHOTOS_PER_CALL = 10;

async function download(urls: string[]): Promise<PhotoToDescribe[]> {
  const photos: PhotoToDescribe[] = [];
  let total = 0;
  for (const url of urls.slice(0, MAX_PHOTOS_PER_CALL)) {
    if (!isOwnCarImage(url)) continue;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const mimeType = res.headers.get("content-type")?.split(";")[0] ?? "";
      if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) continue;
      const bytes = Buffer.from(await res.arrayBuffer());
      if (total + bytes.length > MAX_REQUEST_BYTES) break;
      total += bytes.length;
      photos.push({ url, bytes, mimeType });
    } catch (error) {
      logError("Could not fetch a car image for alt text", error);
    }
  }
  return photos;
}

/**
 * Describe any undescribed photos of a car and drop alt text for photos it no
 * longer has. Runs after a save has answered (see the car actions), so it
 * never throws: a failure leaves the fallback alt text, and the next save
 * tries again.
 */
export async function refreshImageAlts(
  carId: string,
  organizationId: string,
  caller: AiCallerContext
): Promise<void> {
  try {
    const car = await carRepository.findCarById(carId);
    // Scoped: a car id from another tenant is never touched.
    if (!car || car.organizationId !== organizationId) return;

    const images: string[] = car.images ?? [];
    const existing = parseImageAlts(car.imageAlts);
    const pending = undescribedImages(images, existing);

    let described: ImageAlts = {};
    if (pending.length > 0) {
      const photos = await download(pending);
      described = await describeCarImages(
        { year: car.year, make: car.make, model: car.model },
        photos,
        caller
      );
    }

    const merged = mergeImageAlts(images, existing, described);
    if (!sameAlts(merged, existing)) {
      await carRepository.updateCarImageAlts(carId, organizationId, merged);
    }
  } catch (error) {
    logError("Car image alt text skipped", error);
  }
}
