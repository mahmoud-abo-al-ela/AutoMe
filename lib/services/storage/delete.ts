// Storage delete functions
import { createAdminClient, createClient } from "@/lib/supabase";

export function storagePathOf(url: string, bucketName: string): string | null {
  const marker = `/storage/v1/object/public/${bucketName}/`;
  const at = url.indexOf(marker);
  if (at < 0) return null;
  const path = url.slice(at + marker.length).split(/[?#]/)[0];
  try {
    return decodeURIComponent(path) || null;
  } catch {
    return null;
  }
}

export async function deleteCarImages(imageUrls: string[], carId: string, bucketName = "car-images") {
  if (!imageUrls || imageUrls.length === 0) {
    return;
  }

  const folder = `cars/${carId}/`;
  const filePaths = imageUrls
    .map((url) => storagePathOf(url, bucketName))
    .filter((path): path is string => path !== null && path.startsWith(folder) && !path.includes(".."));
  if (filePaths.length === 0) return;

  const { error } = await createAdminClient().storage.from(bucketName).remove(filePaths);

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
