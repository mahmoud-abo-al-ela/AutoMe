import { describe, expect, it } from "vitest";
import { planSettingsSchema } from "./schemas";

const professional = {
  monthlyPrice: 80000,
  yearlyPrice: 800000,
  trialDays: 0,
  maxCars: 100,
  maxMembers: 10,
  maxImagesPerCar: 15,
  auditLogRetentionDays: 365,
  aiProcessing: { enabled: true, limit: 100 },
  aiAssistant: true,
  chat: true,
  prioritySupport: true,
};

describe("a plan's settings", () => {
  it("takes a plan as the editor sends it", () => {
    expect(planSettingsSchema.parse(professional)).toEqual(professional);
  });

  it("takes -1 as no limit, and null as keeping activity always", () => {
    const enterprise = { ...professional, maxCars: -1, maxMembers: -1, auditLogRetentionDays: null, aiProcessing: { enabled: true, limit: -1 } };
    expect(planSettingsSchema.safeParse(enterprise).success).toBe(true);
  });

  it("refuses limits that would lock dealerships out or read like typos", () => {
    expect(planSettingsSchema.safeParse({ ...professional, maxCars: 0 }).success).toBe(false);
    expect(planSettingsSchema.safeParse({ ...professional, maxMembers: -5 }).success).toBe(false);
    expect(planSettingsSchema.safeParse({ ...professional, monthlyPrice: -100 }).success).toBe(false);
    expect(planSettingsSchema.safeParse({ ...professional, monthlyPrice: 800.5 }).success).toBe(false);
    expect(planSettingsSchema.safeParse({ ...professional, maxImagesPerCar: 0 }).success).toBe(false);
  });
});
