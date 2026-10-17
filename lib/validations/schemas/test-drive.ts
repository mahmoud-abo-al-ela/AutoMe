import { z } from "zod";
import { isDateString } from "@/lib/utils/date-only";

const testDriveDate = z.string().refine(isDateString, "Date must be YYYY-MM-DD");

export const requestTestDriveSchema = z.object({
  carId: z.string().min(1, "Car is required"),
  date: testDriveDate,
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  notes: z.string().max(1000).optional().default(""),
});

export const editTestDriveSchema = z.object({
  testDriveId: z.string().min(1, "Test drive ID is required"),
  date: testDriveDate,
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  notes: z.string().max(1000).optional().default(""),
});

export const updateTestDriveStatusSchema = z.object({
  testDriveId: z.string().min(1, "Test drive ID is required"),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
});

export type RequestTestDriveInput = z.infer<typeof requestTestDriveSchema>;
export type EditTestDriveInput = z.infer<typeof editTestDriveSchema>;
export type UpdateTestDriveStatusInput = z.infer<typeof updateTestDriveStatusSchema>;
