/**
 * Shrink a photo in the browser before it is sent for an AI read.
 *
 * Three phone photos are 10–15 MB together, and a Vercel function refuses a
 * request body over ~4.5 MB. At 1600 px on the long edge badges and lettering
 * stay readable — which is what identifying the car rests on — and the model
 * would scale the image down itself anyway, after the upload had been paid for.
 *
 * Only the copy sent to the AI is shrunk; the listing keeps the originals.
 * Any failure returns the original: a larger upload beats no upload.
 */

const MAX_EDGE = 1600;
const QUALITY = 0.85;
/** Small enough already: re-encoding would only cost quality. */
const KEEP_UNDER_BYTES = 700 * 1024;

export async function shrinkForAi(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= KEEP_UNDER_BYTES) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
