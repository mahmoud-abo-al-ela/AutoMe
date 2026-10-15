import { describe, it, expect, vi } from "vitest";

// The real module refuses to load without env.
vi.mock("@/lib/supabase", () => ({ createClient: vi.fn(), createAdminClient: vi.fn() }));

import { createAdminClient, createClient } from "@/lib/supabase";
import { processImageFile, uploadCarImages } from "@/lib/services/storage/upload";
import { ValidationError } from "@/lib/utils/errors";
import { carSchema } from "@/lib/validations/schemas";

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0];

/**
 * Car photos are uploaded with a service-side client, so the declared type and
 * name — the sender's claim — must not decide what is stored.
 */
describe("processImageFile", () => {
  it("stores a file as the format its bytes are, whatever it claims", async () => {
    const file = new File([new Uint8Array(PNG)], "car.jpg", { type: "image/jpeg" });
    await expect(processImageFile(file)).resolves.toMatchObject({
      contentType: "image/png",
      extension: "png",
    });
  });

  it("refuses content that is not an image", async () => {
    const html = new File([Buffer.from("<html><script></script></html>")], "car.jpg", {
      type: "image/jpeg",
    });
    await expect(processImageFile(html)).rejects.toBeInstanceOf(ValidationError);
  });

  it("refuses a photo over 5 MB before reading it", async () => {
    const big = new File([new Uint8Array(JPEG)], "big.jpg", { type: "image/jpeg" });
    Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });
    const read = vi.spyOn(big, "arrayBuffer");
    await expect(processImageFile(big)).rejects.toBeInstanceOf(ValidationError);
    expect(read).not.toHaveBeenCalled();
  });

  it("checks a data: URL's bytes too, not its declared type", async () => {
    const lie = `data:image/png;base64,${Buffer.from("not an image").toString("base64")}`;
    await expect(processImageFile(lie)).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("adding a car with photo files", () => {
  it("accepts the Files the dealer form sends", () => {
    // Used to be refused: "images.0: Expected string, received object".
    const result = carSchema.safeParse({
      title: "Toyota Corolla 2020",
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      price: 850000,
      mileage: 62000,
      bodyType: "Sedan",
      fuelType: "Gasoline",
      transmission: "Automatic",
      color: "Silver",
      seats: 5,
      description: "Single owner, full service history.",
      status: "Available",
      images: [new File([new Uint8Array(JPEG)], "car.jpg", { type: "image/jpeg" })],
    });
    expect(result.success).toBe(true);
  });
});

describe("uploadCarImages when one photo fails", () => {
  const png = () => new File([new Uint8Array(PNG)], "car.png", { type: "image/png" });

  it("removes the photos that did upload, then throws the failure", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://cdn.test");
    const upload = vi.fn(async (path: string) =>
      path.endsWith("-1.png") ? { error: { message: "storage unavailable" } } : { error: null }
    );
    const remove = vi.fn(async (_paths: string[]) => ({ error: null }));
    vi.mocked(createClient).mockResolvedValue({ storage: { from: () => ({ upload }) } } as never);
    vi.mocked(createAdminClient).mockReturnValue({ storage: { from: () => ({ remove }) } } as never);

    await expect(uploadCarImages([png(), png(), png()], "car-1")).rejects.toThrow("Upload failed: storage unavailable");

    expect(upload).toHaveBeenCalledTimes(3);
    expect(remove).toHaveBeenCalledTimes(1);
    const removed = remove.mock.calls[0][0];
    expect(removed).toHaveLength(2);
    expect(removed.every((path) => path.startsWith("cars/car-1/") && !path.endsWith("-1.png"))).toBe(true);
    vi.unstubAllEnvs();
  });

  it("still throws the upload's failure when the cleanup fails too", async () => {
    const upload = vi.fn(async (path: string) =>
      path.endsWith("-0.png") ? { error: { message: "storage unavailable" } } : { error: null }
    );
    vi.mocked(createClient).mockResolvedValue({ storage: { from: () => ({ upload }) } } as never);
    vi.mocked(createAdminClient).mockReturnValue({
      storage: { from: () => ({ remove: async () => ({ error: { message: "also down" } }) }) },
    } as never);

    await expect(uploadCarImages([png(), png()], "car-1")).rejects.toThrow("Upload failed: storage unavailable");
  });
});
