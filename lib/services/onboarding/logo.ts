// Onboarding logo storage helpers.
import { createAdminClient } from "@/lib/supabase";

/**
 * Upload a base64 data-URL logo to Supabase Storage and return its public URL.
 * Returns null when the input is not a base64 image.
 */
export async function uploadLogoToStorage(
  base64Data: string | null | undefined,
  organizationSlug: string
): Promise<string | null> {
  if (!base64Data || !base64Data.startsWith("data:image")) {
    return null;
  }

  const supabase = createAdminClient();

  // Extract the base64 content and mime type
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    return null;
  }

  const mimeType = matches[1];
  const base64Content = matches[2];
  const buffer = Buffer.from(base64Content, "base64");

  // Determine file extension
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  const ext = extMap[mimeType] || "png";
  const fileName = `${organizationSlug}-${Date.now()}.${ext}`;

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from("organization-logos")
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("organization-logos")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Resolve the logo value from an onboarding payload into a stored URL:
 * base64 data-URLs are uploaded, existing URLs pass through, empty -> null.
 */
export async function resolveLogoUrl(
  logo: string | null | undefined,
  slug: string
): Promise<string | null> {
  if (logo && logo.startsWith("data:image")) {
    return uploadLogoToStorage(logo, slug);
  }
  return logo || null;
}
