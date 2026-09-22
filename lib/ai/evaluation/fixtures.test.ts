import { describe, it, expect } from "vitest";
import { carPhoto, notACar, gradientNotACar } from "@/lib/ai/evaluation/fixtures";

// The PNG encoder is hand-written, so a malformed header would send the
// evaluation suite a file the API rejects — and the suite would report a
// provider error where the fixture was at fault.
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("generated fixtures", () => {
  it.each([
    ["flat", notACar],
    ["gradient", gradientNotACar],
  ])("writes a well-formed PNG for the %s negative case", (_label, make) => {
    const { bytes, mimeType } = make();

    expect(bytes.subarray(0, 8)).toEqual(PNG_SIGNATURE);
    expect(bytes.subarray(12, 16).toString("ascii")).toBe("IHDR");
    expect(bytes.subarray(bytes.length - 8, bytes.length - 4).toString("ascii")).toBe("IEND");
    expect(mimeType).toBe("image/png");
  });

  it("declares the dimensions it painted", () => {
    const { bytes } = notACar();
    expect(bytes.readUInt32BE(16)).toBe(320);
    expect(bytes.readUInt32BE(20)).toBe(240);
  });

  it("produces a mime type the upload guard accepts", () => {
    // prepareImage allowlists jpeg/png/webp; a fixture it rejects never
    // reaches the model at all.
    for (const { mimeType } of [carPhoto(), notACar(), gradientNotACar()]) {
      expect(["image/jpeg", "image/png", "image/webp"]).toContain(mimeType);
    }
  });

  it("reads the car photo the repo ships", () => {
    const { bytes } = carPhoto();
    expect(bytes.length).toBeGreaterThan(1000);
    // JPEG SOI marker.
    expect(bytes.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
  });
});
