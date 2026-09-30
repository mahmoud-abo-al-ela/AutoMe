// Storage upload functions
import { createClient } from "@/lib/supabase";
import { ValidationError } from "@/lib/utils/errors";
import { VALIDATION_RULES } from "@/lib/constants/validation";
import { IMAGE_EXTENSION, sniffImageType } from "@/lib/utils/image-type";

/** Matches the 5 MB the car form quotes and checks client-side. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Upload bytes only as the image format they actually are. The declared type
 * and name are the sender's claim — a server action receives whatever a caller
 * sends — so the stored content type and extension come from the bytes.
 */
function checkedImage(buffer: Buffer) {
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new ValidationError("Each image must be 5 MB or smaller", "images");
  }
  const contentType = sniffImageType(buffer);
  if (!contentType) {
    throw new ValidationError("Only JPEG, PNG and WebP images are allowed", "images");
  }
  return { buffer, extension: IMAGE_EXTENSION[contentType], contentType };
}

/**
 * Process image file (File object or base64 string)
 */
export async function processImageFile(imageFile: File | string) {
  if (imageFile instanceof File) {
    return processFileObject(imageFile);
  } else if (
    typeof imageFile === "string" &&
    imageFile.startsWith("data:image/")
  ) {
    return processBase64String(imageFile);
  }
  throw new ValidationError("Invalid image format", "image");
}

/**
 * Process File object
 */
async function processFileObject(file: File) {
  // Refuse before reading an oversized body into memory.
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ValidationError("Each image must be 5 MB or smaller", "images");
  }
  return checkedImage(Buffer.from(await file.arrayBuffer()));
}

/**
 * Process base64 string
 */
function processBase64String(base64String: string) {
  return checkedImage(Buffer.from(base64String.split(",")[1] ?? "", "base64"));
}

/**
 * Get public URL for uploaded file
 */
export function getPublicUrl(bucketName: string, filePath: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filePath}`;
}

/**
 * Upload a single image
 */
export async function uploadImage(
  imageFile: File | string,
  folderPath: string,
  index: number,
  bucketName = "car-images"
) {
  const { buffer, extension, contentType } = await processImageFile(imageFile);

  const fileName = `image-${Date.now()}-${index}.${extension}`;
  const filePath = `${folderPath}/${fileName}`;

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, buffer, { contentType });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return getPublicUrl(bucketName, filePath);
}

/**
 * Upload multiple car images
 */
export async function uploadCarImages(
  images: Array<File | string>,
  carId: string,
  bucketName = "car-images",
  maxImages = VALIDATION_RULES.CAR.MAX_IMAGES
) {
  if (!Array.isArray(images) || images.length === 0) {
    throw new ValidationError("At least one image is required", "images");
  }

  if (images.length > maxImages) {
    throw new ValidationError(
      `Maximum of ${maxImages} images allowed`,
      "images"
    );
  }

  const folderPath = `cars/${carId}`;
  const uploadPromises = images.map((image, index) =>
    uploadImage(image, folderPath, index, bucketName)
  );

  return await Promise.all(uploadPromises);
}

/**
 * Upload car images in batches (for better performance)
 */
export async function uploadCarImagesInBatches(images: Array<File | string>, carId: string, batchSize = 3) {
  const results: string[] = [];

  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const folderPath = `cars/${carId}`;

    const batchResults = await Promise.all(
      batch.map((img, idx) => uploadImage(img, folderPath, i + idx))
    );

    results.push(...batchResults);
  }

  return results;
}
