import { imagePart, type AiPart } from "@/lib/ai/provider/gemini";
import { ValidationError } from "@/lib/utils/errors";

/**
 * Turn an uploaded file into a validated image part for the model.
 *
 * The client forms already check type and size, which is a usability feature,
 * not a control — a server action is a public RPC endpoint and receives whatever
 * the caller sends. Both limits are enforced here as well, because everything
 * past this point costs provider quota proportional to the bytes.
 *
 * ---
 *
 * OPEN DECISION — personal data leaves the platform here, unredacted.
 *
 * This is the one function that sends user-supplied photographs to Google. Car
 * photographs taken on a dealer's lot or by a buyer on the street routinely
 * contain, in the frame: Egyptian licence plates, bystanders' faces, and shop
 * signage carrying a business name and phone number. None of it is needed to
 * identify a car, and none of it is currently removed.
 *
 * This has never been assessed. It is recorded here rather than quietly shipped
 * because it is a product and legal question, not a coding one, and the answer
 * changes what this function should do:
 *
 *   1. Accept it, and say so in the privacy policy — the honest minimum, since
 *      the policy today does not mention sending user images to a third party.
 *   2. Detect and blur plates and faces before both storage and this call.
 *      Costs another model pass or a local vision step per image.
 *   3. Downscale aggressively first. Cheap, and it degrades small text like
 *      plate characters well before it affects make/model recognition — a
 *      partial mitigation that costs nothing and also reduces token spend.
 *
 * Whoever picks, record the choice here so the next reader does not re-derive
 * the question.
 */

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Mirrors the 10 MB cap the two upload UIs quote to the user. */
const MAX_BYTES = 10 * 1024 * 1024;

export interface PreparedImage {
  part: AiPart;
  /** Raw bytes, used as the response-cache key. */
  bytes: Buffer;
}

/**
 * The image format the bytes actually are. `file.type` is whatever the caller
 * claimed — a public endpoint receives anything — so the part sent to the
 * provider is labelled from the file's own signature instead.
 */
function sniffImageType(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
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
