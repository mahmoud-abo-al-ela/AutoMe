import { z } from "zod";

// Step 1: Organization Details Schema
export const orgDetailsSchema = z.object({
    name: z
        .string()
        .min(1, "Organization name is required")
        .min(3, "Name must be at least 3 characters")
        .max(100, "Name must be less than 100 characters"),
    email: z.string().min(1, "Email is required").email("Please enter a valid email"),
    phone: z.string().min(1, "Phone number is required").min
        (8, "Phone must be at least 8 digits"),
    address: z.string().min
        (1, "Address is required").min(5, "Address must be at least 5 characters"),
    logo: z.string().min(1, "Please upload a logo for your dealership"),
});

// Step 2: Plan Selection Schema
export const planSelectionSchema = z.object({
    planId: z.string().min(1, "Please select a plan"),
});

// Step 3: Working Hours Schema
export const workingHoursSchema = z.object({
    workingHours: z.object({
        monday: z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean(),
        }),
        tuesday: z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean(),
        }),
        wednesday: z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean(),
        }),
        thursday: z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean(),
        }),
        friday: z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean(),
        }),
        saturday: z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean(),
        }),
        sunday: z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean(),
        }),
    }),
});

// Combined schema for all steps
export const onboardingSchema = orgDetailsSchema
    .merge(planSelectionSchema)
    .merge(workingHoursSchema);
