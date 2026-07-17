"use server";
import { withOrgAuth } from "@/lib/middleware/with-auth";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from '@google/genai';
import * as carService from "@/lib/services/car";
import { createSuccessResponse } from "@/lib/utils/response";
import { RateLimitError, ValidationError, NotFoundError, AuthorizationError } from "@/lib/utils/errors";
import { validateAction } from "@/lib/middleware/with-validation";
import { carSchema, updateCarSchema, updateCarFullSchema } from "@/lib/validations/schemas";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { withPlanGate } from "@/lib/middleware/with-plan-gate";
import { withUsageLimit } from "@/lib/middleware/with-usage-limit";
import { z } from "zod";


export async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function processCarImageWithAI(file) {
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
- Price MUST be in USD ($), convert from any other currency
- Price format: just the number without currency symbol (e.g., "45000" not "45000 USD")

Schema:
{
  "make": "string",
  "model": "string",
  "year": number,
  "color": "string",
  "price": "string (USD amount without symbol)",
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

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;

    let parsed;
    try {
      parsed = JSON.parse(text);
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
    withUsageLimit("aiProcessing", async (ctx, file) => {
      const parsed = await processCarImageWithAI(file);
      return createSuccessResponse(parsed);
    })
  )
);


export const getCarPlanLimits = withOrgAuth(async (ctx) => {
  const plan = ctx.organization.subscription?.plan;
  const maxImages = plan?.maxImagesPerCar ?? 5;
  const features = plan?.features || {};
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
  withUsageLimit("cars", async (ctx, payload) => {
    const rawData = payload.data || payload;
    const carData = validateAction(carSchema, rawData);
    const car = await carService.createCar(carData, ctx.userId, ctx.organization.id);

    revalidatePath(`/org/${ctx.organization.slug}/cars`);
    return createSuccessResponse(car, "Car added successfully");
  })
);

export const getCars = withOrgAuth(async (ctx, search = "", status = "all", page = 1, limit = 10) => {
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

export const deleteCar = withOrgAuth(async (ctx, carId) => {
  await carService.deleteCar(carId, ctx.userId, ctx.organization.id);

  revalidatePath(`/org/${ctx.organization.slug}/cars`);
  return createSuccessResponse(null, "Car deleted successfully");
});

export const updateCar = withOrgAuth(async (ctx, carId, { status, featured }) => {
  const updateData = {};
  if (status !== undefined) updateData.status = status;
  if (featured !== undefined) updateData.featured = featured;

  const validatedUpdate = validateAction(updateCarSchema, updateData);

  const updatedCar = await carService.updateCar(carId, validatedUpdate, ctx.userId, ctx.organization.id);

  revalidatePath(`/org/${ctx.organization.slug}/cars`);
  return createSuccessResponse(updatedCar, "Car updated successfully");
});

export const getCarForEdit = withOrgAuth(async (ctx, carId) => {
  const car = await carService.getCarById(carId);
  if (!car) {
    throw new NotFoundError("Car");
  }
  // Verify car belongs to user's organization
  if (car.organizationId !== ctx.organization.id && ctx.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this car");
  }
  return createSuccessResponse(car);
});

export const updateCarFull = withOrgAuth(async (ctx, carId, payload) => {
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
