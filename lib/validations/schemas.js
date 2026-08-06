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

export const updateCarFullSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
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
  status: z.enum(["Available", "Sold", "Unavailable", "AVAILABLE", "UNAVAILABLE", "SOLD"]).optional(),
  featured: z.boolean().optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.any()),
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

const optionalText = (max) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max).optional().nullable()
  );

const optionalEmail = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().email("Invalid email address").max(120).optional().nullable()
);

export const organizationProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: optionalEmail,
  phone: optionalText(40),
  website: optionalText(200),
  address: optionalText(240),
  description: optionalText(1000),
  city: optionalText(80),
  region: optionalText(80),
  country: z.string().trim().length(2, "Country must be a 2-letter ISO code").toUpperCase(),
});

// ============ TEAM ============

export const inviteTeamMemberSchema = z.object({
  // Kept for backward-compatible call sites; the action always uses ctx.organization.id.
  organizationId: z.string().optional(),
  email: z.string().trim().email("Invalid email address").max(120),
  role: z.enum(["OWNER", "MEMBER"]),
});

export const updateMemberRoleSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  newRole: z.enum(["OWNER", "MEMBER"]),
});

export const memberIdSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
});

// ============ TEST DRIVE ============

export const requestTestDriveSchema = z.object({
  carId: z.string().min(1, "Car is required"),
  date: z.coerce.date(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  notes: z.string().max(1000).optional().default(""),
});

export const editTestDriveSchema = z.object({
  testDriveId: z.string().min(1, "Test drive ID is required"),
  date: z.coerce.date(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  notes: z.string().max(1000).optional().default(""),
});

export const updateTestDriveStatusSchema = z.object({
  testDriveId: z.string().min(1, "Test drive ID is required"),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
});

// ============ DEALERSHIP REVIEW ============

export const dealershipReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Rating is required").max(5),
  title: z.string().trim().max(120).optional().nullable(),
  comment: z.string().trim().max(2000).optional().nullable(),
});

// ============ PAYMENT ============

export const createSubscriptionSchema = z.object({
  planId: z.string().min(1, "Plan is required"),
  billingInterval: z.enum(["month", "year"]).default("month"),
});

export const createCheckoutSessionSchema = z.object({
  planId: z.string().min(1, "Plan is required"),
  billingPeriod: z.enum(["month", "year"]),
  onboardingSessionId: z.string().min(1).optional().nullable(),
});

// ============ IMPERSONATION (super-admin) ============

export const startImpersonationSchema = z.object({
  organizationId: z.string().min(1, "Organization is required"),
  targetUserId: z.string().min(1, "Target user is required"),
});

