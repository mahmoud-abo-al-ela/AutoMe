"use server";
import { db } from "@/lib/prisma";
import { createClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

async function fileToBase64(file) {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return base64;
}

export async function processCarImageWithAI(file) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not defined");
    }

    // Validate file
    if (!file || !file.type.startsWith("image/")) {
      throw new Error("Invalid file type; must be an image");
    }
    console.log("Processing file", { type: file.type, size: file.size });

    const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    const base64Image = await fileToBase64(file);
    console.log("Base64 image generated", { length: base64Image.length });

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: file.type,
      },
    };

    const prompt = `
      Analyze this car image and extract the following information:
      1. Make (manufacturer)
      2. Model
      3. Year (approximately)
      4. Color
      5. Body type (SUV, Sedan, Hatchback, etc.)
      6. Mileage
      7. Fuel type (your best guess)
      8. Transmission type (your best guess)
      9. Price (your best guess)
      10. Short Description as to be added to a car listing
      11. Number of seats 

      Format your response as a clean JSON object with these fields:
      {
        "make": "",
        "model": "",
        "year": 0,
        "color": "",
        "price": "",
        "mileage": "",
        "bodyType": "",
        "fuelType": "",
        "transmission": "",
        "description": "",
        "seats": 0,
        "features": "",
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
    console.log("Raw API response:", json);

    // Clean response
    let cleanData = json
      .replace(/```(json)?\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const jsonMatch = cleanData.match(/{[\s\S]*}/);
    if (jsonMatch) {
      cleanData = jsonMatch[0];
      console.log("Extracted JSON:", cleanData);
    } else {
      throw new Error("No valid JSON object found in response");
    }

    // Validate and parse JSON
    try {
      const parsedData = JSON.parse(cleanData);
      const requiredData = [
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
      const missingData = requiredData.filter(
        (field) => parsedData[field] === undefined
      );
      if (missingData.length > 0) {
        throw new Error(`Missing required fields: ${missingData.join(", ")}`);
      }
      return { success: true, data: parsedData };
    } catch (error) {
      console.error("JSON parse error:", error.message, {
        position: 592,
        snippet: cleanData.slice(Math.max(0, 592 - 20), 612),
      });
      return {
        success: false,
        error: `Invalid JSON response: ${error.message}`,
      };
    }
  } catch (error) {
    console.error("Error processing car image with AI:", {
      message: error.message,
      stack: error.stack,
      code: error.code || "UNKNOWN",
    });
    return {
      success: false,
      error: `Failed to process image: ${error.message}`,
    };
  }
}

export async function addCar(payload) {
  const carData = payload.data || payload;
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }
    const user = await db.user.findUnique({
      where: {
        clerkId: userId,
      },
    });
    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }
    const carId = uuidv4();
    const folderPath = `cars/${carId}`;
    const supabase = await createClient();
    const imageUrls = [];
    for (let i = 0; i < carData.images.length; i++) {
      const imageFile = carData.images[i];

      // Handle both File objects and base64 strings
      let imageBuffer;
      let fileExtension;
      let contentType;

      if (imageFile instanceof File) {
        // Handle File object
        const arrayBuffer = await imageFile.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);

        // Get file extension from file type or name
        if (imageFile.type) {
          contentType = imageFile.type;
          fileExtension = imageFile.type.split("/")[1] || "jpeg";
        } else {
          // Extract extension from filename
          const nameParts = imageFile.name.split(".");
          fileExtension = nameParts.length > 1 ? nameParts.pop() : "jpeg";
          contentType = `image/${fileExtension}`;
        }
      } else if (
        typeof imageFile === "string" &&
        imageFile.startsWith("data:image/")
      ) {
        // Handle base64 string (existing logic)
        const base64 = imageFile.split(",")[1];
        imageBuffer = Buffer.from(base64, "base64");

        const mimeMatch = imageFile.match(/data:image\/([a-zA-Z0-9]+);/);
        fileExtension = mimeMatch ? mimeMatch[1] : "jpeg";
        contentType = `image/${fileExtension}`;
      } else {
        console.warn("Skipping invalid image data:", typeof imageFile);
        continue;
      }

      // Create filename
      const fileName = `image-${Date.now()}-${i}.${fileExtension}`;
      const filePath = `${folderPath}/${fileName}`;
      const { data, error } = await supabase.storage
        .from("car-images")
        .upload(filePath, imageBuffer, {
          contentType: contentType,
        });
      if (error) {
        console.error("Supabase upload error:", error);
        return {
          success: false,
          error: "Error uploading image to supabase: " + error.message,
        };
      }

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/car-images/${filePath}`;
      imageUrls.push(publicUrl);
    } // Map status from form to enum
    const statusMapping = {
      Available: "AVAILABLE",
      Sold: "SOLD",
      Unavailable: "UNAVAILABLE",
    };

    const car = await db.car.create({
      data: {
        id: carId,
        title: carData.title,
        make: carData.make,
        model: carData.model,
        year: carData.year,
        color: carData.color,
        price: carData.price,
        mileage: carData.mileage,
        bodyType: carData.bodyType,
        fuelType: carData.fuelType,
        transmission: carData.transmission,
        description: carData.description,
        location: carData.location,
        features: carData.features,
        seats: carData.seats,
        status: statusMapping[carData.status] || "AVAILABLE",
        featured: carData.featured,
        images: imageUrls,
      },
    });

    // Convert Decimal fields to numbers for client component compatibility
    const serializedCar = {
      ...car,
      price: Number(car.price),
      createdAt: car.createdAt.toISOString(),
      updatedAt: car.updatedAt.toISOString(),
    };

    revalidatePath("/admin/cars");
    return {
      success: true,
      data: serializedCar,
    };
  } catch (error) {
    console.error("Error adding car", error);
    return {
      success: false,
      error: "Error adding car: " + error.message,
    };
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
      return {
        success: false,
        error: "User not authenticated",
      };
    }
    const user = await db.user.findUnique({
      where: {
        clerkId: userId,
      },
    });
    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Map status from filter to enum
    const statusMapping = {
      available: "AVAILABLE",
      sold: "SOLD",
      unavailable: "UNAVAILABLE",
    };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await db.car.count({
      where: {
        OR: [{ title: { contains: search, mode: "insensitive" } }],
        status: status === "all" ? undefined : statusMapping[status] || status,
      },
    });

    // Get paginated cars
    const cars = await db.car.findMany({
      where: {
        OR: [{ title: { contains: search, mode: "insensitive" } }],
        status: status === "all" ? undefined : statusMapping[status] || status,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Convert Decimal fields to numbers for client component compatibility
    const serializedCars = cars.map((car) => ({
      ...car,
      price: Number(car.price),
      createdAt: car.createdAt.toISOString(),
      updatedAt: car.updatedAt.toISOString(),
    }));

    return {
      success: true,
      data: serializedCars,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + cars.length < totalCount,
      },
    };
  } catch (error) {
    console.error("Error getting cars", error);
    return {
      success: false,
      error: "Error getting cars",
    };
  }
}

export async function deleteCar(carId) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }
    const car = await db.car.findUnique({
      where: {
        id: carId,
      },
    });
    if (!car) {
      return {
        success: false,
        error: "Car not found",
      };
    }
    await db.car.delete({
      where: {
        id: carId,
      },
    });
    const supabase = await createClient();
    const imageUrls = car.images;
    if (imageUrls.length > 0) {
      const filePaths = imageUrls.map((url) => url.split("/").pop());
      await supabase.storage.from("car-images").remove(filePaths);
    }
    revalidatePath("/admin/cars");
    return {
      success: true,
      data: "Car deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting car", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function updateCar(carId, { status, featured }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }
    const car = await db.car.findUnique({
      where: {
        id: carId,
      },
    });
    if (!car) {
      return {
        success: false,
        error: "Car not found",
      };
    }
    const updatedCar = await db.car.update({
      where: {
        id: carId,
      },
      data: {
        status: status,
        featured: featured,
      },
    });

    // Convert Decimal fields to numbers for client component compatibility
    const serializedCar = {
      ...updatedCar,
      price: Number(updatedCar.price),
      createdAt: updatedCar.createdAt.toISOString(),
      updatedAt: updatedCar.updatedAt.toISOString(),
    };

    revalidatePath("/admin/cars");
    return {
      success: true,
      data: serializedCar,
    };
  } catch (error) {
    console.error("Error updating car", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
