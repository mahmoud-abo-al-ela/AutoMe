// Storage delete functions
import { createAdminClient, createClient } from "@/lib/supabase";

/**
 * The object path inside `bucketName` that a public URL from getPublicUrl
 * (…/storage/v1/object/public/<bucket>/<path>) names, or null for any other
 * URL.
 */
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

/**
 * Delete photos of one car. Only objects in that car's own folder
 * (cars/<carId>/, where uploadCarImages puts them) are touched: a URL from
 * anywhere else — another car's, stored on this one before edits were
 * checked — is skipped, never deleted.
 *
 * The path used to be the URL's last two segments (<carId>/<file>), which is
 * not where uploads live, so removed photos were never deleted. Runs with the
 * server's storage key: the folder rule above, not the bucket's public
 * policy, decides what may go.
 */
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
