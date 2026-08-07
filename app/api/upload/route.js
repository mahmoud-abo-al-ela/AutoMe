import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { resolveTenantContext } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { AppError, logError } from "@/lib/utils/errors";

export const runtime = "nodejs";

// The destination bucket must be chosen from a server-side allowlist. It reaches
// the service-role client, which bypasses Supabase RLS — letting the client name
// it would let any authenticated user write to any reachable bucket.
const ALLOWED_BUCKETS = new Set(["organization-logos", "car-images"]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Detect the real image format from magic bytes rather than trusting the
 * client-supplied `file.type` / filename extension. Returns null for anything
 * that isn't one of the formats we accept.
 */
function detectImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", contentType: "image/jpeg" };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return { ext: "png", contentType: "image/png" };
  }
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61
  ) {
    return { ext: "gif", contentType: "image/gif" };
  }
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { ext: "webp", contentType: "image/webp" };
  }
  return null;
}

export async function POST(request) {
  try {
    // Authenticated + tenant-scoped. resolveTenantContext throws typed errors
    // (401/403) mapped below, and gives us a server-sourced organization id.
    const ctx = await resolveTenantContext();

    // Uploads hit a service-role client and are abuse-prone — rate-limit them.
    await enforceRateLimit();

    const formData = await request.formData();
    const file = formData.get("file");
    const bucket = formData.get("bucket") || "organization-logos";

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: "Unknown bucket" }, { status: 400 });
    }

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Cap size before reading the whole body into memory.
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate on content, not on the attacker-controlled `file.type`.
    const detected = detectImageType(buffer);
    if (!detected) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Namespace the object by organization and generate the filename
    // server-side — never interpolate the client-supplied file.name into a path.
    const objectPath = `${ctx.organization.id}/${randomUUID()}.${detected.ext}`;

    const supabase = createAdminClient();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(objectPath, buffer, {
        contentType: detected.contentType,
        upsert: false,
      });

    if (error) {
      logError("Supabase upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(objectPath);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    // Map typed auth/validation/rate-limit errors to real HTTP status codes;
    // never leak internals or return an error as 200.
    if (error instanceof AppError) {
      logError("Upload error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    logError("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
