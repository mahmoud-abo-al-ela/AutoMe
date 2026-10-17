import type { AiCallerContext } from "@/lib/ai/client";
import { describeCarImages, type PhotoToDescribe } from "@/lib/services/ai/describeCarImages";
import { parseImageAlts, type ImageAlts } from "@/lib/utils/image-alts";
import * as carRepository from "@/lib/repositories/car";
import { logError } from "@/lib/utils/errors";

/** Photos the car shows that have no alt text yet, in display order. */
export function undescribedImages(images: string[], alts: ImageAlts): string[] {
  return images.filter((url) => !alts[url]);
}

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

function isOwnCarImage(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!base && url.startsWith(`${base}/storage/v1/object/public/car-images/`);
}

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

export async function refreshImageAlts(
  carId: string,
  organizationId: string,
  caller: AiCallerContext,
  { rethrow = false }: { rethrow?: boolean } = {}
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
    if (rethrow) throw error;
    logError("Car image alt text skipped", error);
  }
}
