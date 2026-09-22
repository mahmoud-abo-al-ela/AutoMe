import { describe, it, expect } from "vitest";
import { prepareImage } from "@/lib/services/ai/image";
import { ValidationError } from "@/lib/utils/errors";

/**
 * A server action is a public RPC endpoint: the dropzone's `accept` list and
 * the form's size check are usability, not control. Everything past this
 * function costs provider quota proportional to the bytes, so the limits are
 * enforced again here against a caller that never touched the UI.
 */

/** A File-like with the fields the guard reads, so a size case costs no memory. */
function fakeFile(type: string, size: number): File {
  return {
    type,
    size,
    arrayBuffer: async () => new ArrayBuffer(8),
  } as unknown as File;
}

describe("prepareImage", () => {
  it("accepts a supported image and returns its bytes for the cache key", async () => {
    const prepared = await prepareImage(fakeFile("image/jpeg", 1024));

    expect(prepared.bytes).toBeInstanceOf(Buffer);
    expect(prepared.part).toHaveProperty("inlineData.mimeType", "image/jpeg");
  });

  it.each(["image/gif", "image/svg+xml", "application/pdf", "text/html", ""])(
    "rejects %s",
    async (type) => {
      await expect(prepareImage(fakeFile(type, 1024))).rejects.toBeInstanceOf(
        ValidationError
      );
    }
  );

  it("rejects a file past the 10MB cap the UI quotes", async () => {
    await expect(
      prepareImage(fakeFile("image/png", 11 * 1024 * 1024))
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects a caller that sent no file at all", async () => {
    await expect(
      prepareImage(undefined as unknown as File)
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("gives every rejection a message key so the reason is translatable", async () => {
    await expect(prepareImage(fakeFile("image/gif", 10))).rejects.toMatchObject({
      messageKey: "errors.ai.unsupportedImage",
    });
  });
});
