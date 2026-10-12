import { z } from "zod";

export const signupCheckoutSchema = z.object({
  planId: z.string().min(1, "Plan is required"),
  // "monthly"/"yearly" is the onboarding UI's vocabulary — it is what the plan
  // toggle holds and what is persisted in the onboarding session.
  billingPeriod: z.enum(["monthly", "yearly"]),
  onboardingSessionId: z.string().min(1),
});

export type SignupCheckoutInput = z.infer<typeof signupCheckoutSchema>;
