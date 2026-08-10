// Storage upload functions
import { createClient } from "@/lib/supabase";
import { ValidationError } from "@/lib/utils/errors";
import { VALIDATION_RULES } from "@/lib/constants/validation";

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
  const arrayBuffer = await file.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    extension: file.type.split("/")[1] || "jpeg",
    contentType: file.type,
  };
}

/**
 * Process base64 string
 */
function processBase64String(base64String: string) {
  const base64 = base64String.split(",")[1];
  const mimeMatch = base64String.match(/data:image\/([a-zA-Z0-9]+);/);
  const extension = mimeMatch ? mimeMatch[1] : "jpeg";

  return {
    buffer: Buffer.from(base64, "base64"),
    extension,
    contentType: `image/${extension}`,
  };
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
