import { describe, it, expect } from "vitest";
import { prepareImage } from "@/lib/services/ai/image";
import { ValidationError } from "@/lib/utils/errors";

/**
 * A server action is a public RPC endpoint: the dropzone's `accept` list and
 * the form's size check are usability, not control. Everything past this
 * function costs provider quota proportional to the bytes, so the limits are
 * enforced again here against a caller that never touched the UI.
 */

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0];

/** A File-like with the fields the guard reads, so a size case costs no memory. */
function fakeFile(type: string, size: number, bytes: number[] = JPEG): File {
  return {
    type,
    size,
    arrayBuffer: async () => new Uint8Array(bytes).buffer,
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

  it("rejects content that is not an image, whatever type it claims", async () => {
    // An HTML page labelled image/jpeg: the claim is the caller's, the bytes
    // are the truth.
    const html = [...Buffer.from("<html><body>")];
    await expect(prepareImage(fakeFile("image/jpeg", 12, html))).rejects.toMatchObject({
      messageKey: "errors.ai.unsupportedImage",
    });
  });

  it("labels the image by its real format, not the claimed one", async () => {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const prepared = await prepareImage(fakeFile("image/jpeg", 8, png));
    expect(prepared.part).toHaveProperty("inlineData.mimeType", "image/png");
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
