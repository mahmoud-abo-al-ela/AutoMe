// Storage delete functions
import { createClient } from "@/lib/supabase";

/**
 * Delete car images
 */
export async function deleteCarImages(imageUrls: string[], bucketName = "car-images") {
  if (!imageUrls || imageUrls.length === 0) {
    return;
  }

  const filePaths = imageUrls.map((url) => {
    const parts = url.split("/");
    return parts.slice(-2).join("/");
  });

  const supabase = await createClient();
  const { error } = await supabase.storage.from(bucketName).remove(filePaths);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Delete entire car folder
 */
export async function deleteCarFolder(carId: string, bucketName = "car-images") {
  const folderPath = `cars/${carId}`;
  const supabase = await createClient();

  const { data: files, error: listError } = await supabase.storage
    .from(bucketName)
    .list(folderPath);

  if (listError) {
    throw new Error(`Failed to list files: ${listError.message}`);
  }

  if (!files || files.length === 0) {
    return;
  }

  const filePaths = files.map((file) => `${folderPath}/${file.name}`);
  const { error: deleteError } = await supabase.storage
    .from(bucketName)
    .remove(filePaths);

  if (deleteError) {
    throw new Error(`Failed to delete files: ${deleteError.message}`);
  }
}
