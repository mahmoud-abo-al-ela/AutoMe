"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from '@google/genai';
import * as carService from "@/lib/services/car";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/response";
import { AuthenticationError, ValidationError } from "@/lib/utils/errors";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { checkUser } from "@/lib/checkUser";

export async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function processCarImageWithAI(file) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new ValidationError("GEMINI_API_KEY is not defined");
    }

    if (!file || !file.type?.startsWith("image/")) {
      throw new ValidationError("Invalid file type; must be an image", "file");
    }

    console.log("Processing image:", {
      type: file.type,
      size: file.size,
    });

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
    console.log("Raw AI response:", text);

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

    return createSuccessResponse(parsed);
  } catch (error) {
    console.error("Error processing car image:", error.message);
    return createErrorResponse(error);
  }
}


export async function addCar(payload) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    await checkUser();
    const organization = await getCurrentOrganization();
    if (!organization) {
      throw new AuthenticationError("No organization found");
    }

    const carData = payload.data || payload;
    const car = await carService.createCar(carData, userId, organization.id);

    revalidatePath("/admin/cars");
    return createSuccessResponse(car, "Car added successfully");
  } catch (error) {
    console.error("Error adding car", error);
    return createErrorResponse(error);
  }
}

export async function getCars(
  search = "",
  status = "all",
  page = 1,
  limit = 10
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    await checkUser();
    const organization = await getCurrentOrganization();
    if (!organization) {
      throw new AuthenticationError("No organization found");
    }

    const filters = {
      search: search || undefined,
      status: status === "all" ? undefined : status.toUpperCase(),
      onlyAvailable: false,
    };

    const result = await carService.getCars(filters, { page, limit }, userId, organization.id);

    return createSuccessResponse({
      data: result.cars,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error getting cars", error);
    return createErrorResponse(error);
  }
}

export async function deleteCar(carId) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    await checkUser();
    const organization = await getCurrentOrganization();
    if (!organization) {
      throw new AuthenticationError("No organization found");
    }

    await carService.deleteCar(carId, userId, organization.id);

    revalidatePath("/admin/cars");
    return createSuccessResponse(null, "Car deleted successfully");
  } catch (error) {
    console.error("Error deleting car", error);
    return createErrorResponse(error);
  }
}

export async function updateCar(carId, { status, featured }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    await checkUser();
    const organization = await getCurrentOrganization();
    if (!organization) {
      throw new AuthenticationError("No organization found");
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (featured !== undefined) updateData.featured = featured;

    const updatedCar = await carService.updateCar(carId, updateData, userId, organization.id);

    revalidatePath("/admin/cars");
    return createSuccessResponse(updatedCar, "Car updated successfully");
  } catch (error) {
    console.error("Error updating car", error);
    return createErrorResponse(error);
  }
}
