import { imagePart, type AiPart } from "@/lib/ai/provider/types";
import { ValidationError } from "@/lib/utils/errors";
import { sniffImageType } from "@/lib/utils/image-type";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Mirrors the 10 MB cap the two upload UIs quote to the user. */
const MAX_BYTES = 10 * 1024 * 1024;

export interface PreparedImage {
  part: AiPart;
  /** Raw bytes, used as the response-cache key. */
  bytes: Buffer;
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new ValidationError("No image was provided", "file", {
      key: "errors.ai.noImage",
    });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new ValidationError(
      `Unsupported image type: ${file.type || "unknown"}`,
      "file",
      { key: "errors.ai.unsupportedImage" }
    );
  }

  if (file.size > MAX_BYTES) {
    throw new ValidationError("Image is too large", "file", {
      key: "errors.ai.imageTooLarge",
      params: { max: Math.floor(MAX_BYTES / (1024 * 1024)) },
    });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const actualType = sniffImageType(bytes);
  if (!actualType) {
    throw new ValidationError("File content is not a supported image", "file", {
      key: "errors.ai.unsupportedImage",
    });
  }

  return {
    part: imagePart(bytes.toString("base64"), actualType),
    bytes,
  };
}
