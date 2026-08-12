"use server";
import { withOrgAuth } from "@/lib/middleware/with-auth";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from '@google/genai';
import * as carService from "@/lib/services/car";
import { createSuccessResponse } from "@/lib/utils/response";
import { parseFirstJsonObject } from "@/lib/utils/ai-json";
import { RateLimitError, ValidationError, NotFoundError, AuthorizationError, logError } from "@/lib/utils/errors";
import { createAiUsage } from "@/lib/repositories/ai-usage";
import { validateAction } from "@/lib/middleware/with-validation";
import { carSchema, updateCarSchema, updateCarFullSchema } from "@/lib/validations/schemas";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { withPlanGate } from "@/lib/middleware/with-plan-gate";
import { withUsageLimit } from "@/lib/middleware/with-usage-limit";
import { z } from "zod";
import type { TenantContext } from "@/lib/auth/context";


export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Vision model for image extraction. Overridable via env because the default
// can be retired for an API key without notice (gemini-2.5-flash already 404s
// for new users). gemini-3.5-flash is the current stable flash for this key.
const VISION_MODEL = process.env.GEMINI_MODEL_VISION || "gemini-3.5-flash";

export async function processCarImageWithAI(
  file: File,
  ctx?: TenantContext | null
) {
    const req = await request();
    const decision = await aj.protect(req, { requested: 1 });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        throw new RateLimitError(
          `Rate limit exceeded. ${remaining} requests remaining until ${new Date(
            reset
          ).toLocaleString()}`
        );
      }
      throw new ValidationError("Request denied", "request");
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new ValidationError("GEMINI_API_KEY is not defined");
    }

    if (!file || !file.type?.startsWith("image/")) {
      throw new ValidationError("Invalid file type; must be an image", "file");
    }

    const base64Image = await fileToBase64(file);

    const prompt = `
Analyze the car image and return ONLY a valid JSON object.

Rules:
- No markdown
- No explanations
- All fields must exist
- If unsure, make a reasonable estimate
- Price MUST be the listing price in Egyptian pounds (EGP). Do NOT convert it to
  any other currency. If the image shows a price in another currency, report the
  number exactly as shown without converting it.
- Price format: just the number without currency symbol (e.g., "850000" not "850000 EGP")

Schema:
{
  "make": "string",
  "model": "string",
  "year": number,
  "color": "string",
  "price": "string (EGP amount without symbol, not converted)",
  "mileage": "string",
  "bodyType": "string",
  "fuelType": "string",
  "transmission": "string",
  "description": "string",
  "seats": number,
  "features": "string",
  "confidence": number
}
`;

    // Meter the provider call: exactly one AiUsage row per call, on success and
    // on failure. Without this the plan quota never enforces and the platform
    // rate-limit breaker reads an empty table (see ai-metering skill).
    const started = Date.now();
    let usageMeta = null;
    let success = true;
    let errorCode = null;
    let responseText;

    try {
      const response = await ai.models.generateContent({
        model: VISION_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: base64Image,
                  mimeType: file.type,
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });
      usageMeta = response.usageMetadata ?? null;
      responseText = response.text;
    } catch (error) {
      success = false;
      errorCode =
        (error as { code?: string })?.code ??
        (error as Error)?.name ??
        "UNKNOWN";
      throw error;
    } finally {
      // Metering must never take down the request it is measuring. `await` it
      // (a detached promise dies when the serverless function returns) but
      // swallow its own failure.
      try {
        await createAiUsage({
          organizationId: ctx?.organization?.id ?? null,
          userId: ctx?.userId ?? null,
          feature: "carListingFromImage",
          model: VISION_MODEL,
          inputTokens: usageMeta?.promptTokenCount ?? 0,
          outputTokens: usageMeta?.candidatesTokenCount ?? 0,
          thinkingTokens: usageMeta?.thoughtsTokenCount ?? 0,
          cachedTokens: usageMeta?.cachedContentTokenCount ?? 0,
          latencyMs: Date.now() - started,
          success,
          errorCode,
        });
      } catch (meteringError) {
        logError("AiUsage write failed", meteringError);
      }
    }

    let parsed;
    try {
      parsed = parseFirstJsonObject(responseText);
    } catch {
      throw new ValidationError("AI response is not valid JSON", "ai_response");
    }

    const requiredFields = [
      "make",
      "model",
      "year",
      "color",
      "price",
      "mileage",
      "bodyType",
      "fuelType",
      "transmission",
      "description",
      "seats",
      "features",
      "confidence",
    ];

    const missing = requiredFields.filter(
      (key) => parsed[key] === undefined
    );

    if (missing.length > 0) {
      throw new ValidationError(`Missing required fields: ${missing.join(", ")}`, "ai_response");
    }

    return parsed;
}

export const processCarImageGated = withOrgAuth(
  withPlanGate(
    "aiProcessing",
    withUsageLimit("aiProcessing", async (ctx, file: File) => {
      const parsed = await processCarImageWithAI(file, ctx);
      return createSuccessResponse(parsed);
    })
  )
);


export const getCarPlanLimits = withOrgAuth(async (ctx) => {
  const plan = ctx.organization.subscription?.plan;
  const maxImages = plan?.maxImagesPerCar ?? 5;
  // Plan.features is free-form JSON; narrow before reading the AI entitlement.
  const features = (plan?.features ?? {}) as {
    aiProcessing?: { enabled?: boolean };
  };
  const aiProcessingEnabled = features.aiProcessing?.enabled ?? false;

  return createSuccessResponse({
    maxImagesPerCar: maxImages,
    aiProcessingEnabled,
  });
});

// Backward-compatible alias
export async function getMaxImagesPerCar() {
  return getCarPlanLimits();
}

export const addCar = withOrgAuth(
  withUsageLimit("cars", async (ctx, payload: { data?: unknown } & Record<string, unknown>) => {
    const rawData = payload.data || payload;
    const carData = validateAction(carSchema, rawData);
    const car = await carService.createCar(carData, ctx.userId, ctx.organization.id);

    revalidatePath(`/org/${ctx.organization.slug}/cars`);
    return createSuccessResponse(car, "Car added successfully");
  })
);

export const getCars = withOrgAuth(
  async (
    ctx,
    search: string = "",
    status: string = "all",
    page: number = 1,
    limit: number = 10
  ) => {
  const filters = {
    search: search || undefined,
    status: status === "all" ? undefined : status.toUpperCase(),
    onlyAvailable: false,
  };

  const result = await carService.getCars(filters, { page, limit }, ctx.userId, ctx.organization.id);

  return createSuccessResponse({
    data: result.cars,
    pagination: result.pagination,
  });
});

export const deleteCar = withOrgAuth(async (ctx, carId: string) => {
  await carService.deleteCar(carId, ctx.userId, ctx.organization.id);

  revalidatePath(`/org/${ctx.organization.slug}/cars`);
  return createSuccessResponse(null, "Car deleted successfully");
});

export const updateCar = withOrgAuth(
  async (
    ctx,
    carId: string,
    { status, featured }: { status?: string; featured?: boolean }
  ) => {
  const updateData: { status?: string; featured?: boolean } = {};
  if (status !== undefined) updateData.status = status;
  if (featured !== undefined) updateData.featured = featured;

  const validatedUpdate = validateAction(updateCarSchema, updateData);

  const updatedCar = await carService.updateCar(carId, validatedUpdate, ctx.userId, ctx.organization.id);

  revalidatePath(`/org/${ctx.organization.slug}/cars`);
  return createSuccessResponse(updatedCar, "Car updated successfully");
});

export const getCarForEdit = withOrgAuth(async (ctx, carId: string) => {
  const car = await carService.getCarById(carId);
  if (!car) {
    throw new NotFoundError("Car");
  }
  // Verify car belongs to user's organization
  // Platform admins (UserRole.ADMIN) may reach across orgs for support; regular
  // members may not. `ctx.role` never existed, and MemberRole has no ADMIN value,
  // so the escape hatch has to read the platform role off ctx.user.
  if (car.organizationId !== ctx.organization.id && ctx.user?.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this car");
  }
  return createSuccessResponse(car);
});

export const updateCarFull = withOrgAuth(
  async (
    ctx,
    carId: string,
    payload: { data?: unknown } & Record<string, unknown>
  ) => {
  const rawData = payload.data || payload;
  const carData = validateAction(updateCarFullSchema, rawData);

  const updatedCar = await carService.updateCarFull(
    carId,
    carData,
    ctx.userId,
    ctx.organization.id
  );

  revalidatePath(`/org/${ctx.organization.slug}/cars`);
  return createSuccessResponse(updatedCar, "Car updated successfully");
});
