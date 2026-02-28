"use server";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fileToBase64 } from "./cars";
import * as carRepository from "@/lib/repositories/car";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/response";
import { ValidationError, RateLimitError } from "@/lib/utils/errors";
import { getCurrentOrganization } from "@/lib/getOrganization";

export async function getFeaturedCars(limit = 4) {
  try {
    const organization = await getCurrentOrganization();

    const result = await carRepository.findManyCars(
      {
        featured: true,
        onlyAvailable: true,
        ...(organization?.id && { organizationId: organization.id }),
      },
      { page: 1, limit }
    );

    return createSuccessResponse(result.cars);
  } catch (error) {
    console.error("Error getting featured cars", error);
    return createErrorResponse(error);
  }
}

export async function processImagesSearch(file) {
  try {
    // Rate limiting check
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
      throw new ValidationError("GEMINI_API_KEY is not set", "config");
    }

    const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    const base64Image = await fileToBase64(file);

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: file.type,
      },
    };

    const prompt = `
Analyze this car image and extract the following information for a search query:
1. Make (manufacturer)
2. Body type (SUV, Sedan, Hatchback, etc.)
3. Color

Format your response as a clean JSON object with these fields:
{
  "make": "",
  "bodyType": "",
  "color": "",
  "confidence": 0.0
}

For confidence, provide a value between 0 and 1 representing how confident you are in your overall identification.
Only respond with the JSON object, nothing else.
`;

    // Retry logic
    const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          return await fn();
        } catch (error) {
          if (i === retries - 1) throw error;
          console.warn(`Retry ${i + 1} failed:`, error.message);
          await new Promise((resolve) => setTimeout(resolve, delay * 2 ** i));
        }
      }
    };

    const result = await retryWithBackoff(() =>
      model.generateContent([imagePart, prompt])
    );

    const response = await result.response;
    const json = response.text();

    // Clean response
    let cleanData = json
      .replace(/```(json)?\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const jsonMatch = cleanData.match(/{[\s\S]*}/);
    if (jsonMatch) {
      cleanData = jsonMatch[0];
    } else {
      throw new ValidationError("No valid JSON object found in response", "ai_response");
    }

    const parsedData = JSON.parse(cleanData);
    return createSuccessResponse(parsedData);
  } catch (error) {
    console.error("Error processing image search", error);
    return createErrorResponse(error);
  }
}
