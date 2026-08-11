"use server";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { GoogleGenAI } from "@google/genai";
import { fileToBase64 } from "./cars";
import * as carRepository from "@/lib/repositories/car";
import { createSuccessResponse } from "@/lib/utils/response";
import { parseFirstJsonObject } from "@/lib/utils/ai-json";
import { withErrorHandling } from "@/lib/middleware/with-auth";
import { ValidationError, RateLimitError } from "@/lib/utils/errors";
import { getCurrentOrganization } from "@/lib/getOrganization";

// Vision model for image search. Overridable via env because the default can be
// retired for an API key without notice; gemini-3.5-flash is the current stable
// flash for this key. Keep in sync with processCarImageWithAI in actions/cars.js.
const VISION_MODEL = process.env.GEMINI_MODEL_VISION || "gemini-3.5-flash";

export const getFeaturedCars = withErrorHandling(async (limit = 4) => {
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
});

/** The fields the vision prompt below asks Gemini to return. */
export interface ImageSearchResult {
  make?: string;
  bodyType?: string;
  color?: string;
  confidence?: number;
}

export const processImagesSearch = withErrorHandling(async (file: File) => {
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

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const base64Image = await fileToBase64(file);

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
  const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T | undefined> => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        console.warn(`Retry ${i + 1} failed:`, (error as Error)?.message);
        await new Promise((resolve) => setTimeout(resolve, delay * 2 ** i));
      }
    }
  };

  const response = await retryWithBackoff(() =>
    ai.models.generateContent({
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
    })
  );

  let parsedData;
  try {
    // retryWithBackoff's loop can in principle fall through; either way a
    // missing body lands in the same catch below.
    parsedData = parseFirstJsonObject(response?.text);
  } catch {
    throw new ValidationError("No valid JSON object found in response", "ai_response");
  }

  // Unvalidated model output shaped by the prompt above, so every field is
  // optional: the model can omit one or return an empty string for it.
  return createSuccessResponse(parsedData as ImageSearchResult);
});
