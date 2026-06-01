import { z } from "zod";

export const carSchema = z.object({
  make: z.string().min(1, "Make is required").max(50),
  model: z.string().min(1, "Model is required").max(50),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  price: z.coerce.number().positive("Price must be greater than 0"),
  mileage: z.coerce.number().min(0, "Mileage cannot be negative"),
  bodyType: z.string().min(1, "Body type is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  transmission: z.string().min(1, "Transmission is required"),
  color: z.string().min(1, "Color is required"),
  seats: z.coerce.number().int().min(1).max(12),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  location: z.string().min(1, "Location is required"),
  status: z.enum(["AVAILABLE", "UNAVAILABLE", "SOLD"]).optional(),
  featured: z.boolean().optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).min(1, "At least one image is required").max(20),
});

export const updateCarSchema = z.object({
  status: z.enum(["AVAILABLE", "UNAVAILABLE", "SOLD"]).optional(),
  featured: z.boolean().optional(),
});

export const organizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z.string().min(3, "Slug must be at least 3 characters").max(50).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  planId: z.string().min(1, "Plan ID is required"),
  workingHours: z.record(
    z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean()
    })
  ).optional(),
  userId: z.string().optional(),
  subscriptionId: z.string().optional().nullable(),
  paymentIntentId: z.string().optional().nullable(),
});
