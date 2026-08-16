import type { LucideIcon } from "lucide-react";
import type { getOnboardingData } from "@/lib/services/onboarding";
import type { checkUser } from "@/lib/checkUser";

/** One day's opening times as the wizard edits them. */
export interface OnboardingDayHours {
  open: string;
  close: string;
  closed: boolean;
}

/**
 * The wizard's own lowercase day keys. Deliberately not the Prisma `DayOfWeek`
 * enum: this is the client-side form shape, and the mapping to the stored
 * uppercase enum happens in the submit action.
 */
export type OnboardingDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type OnboardingWorkingHours = Record<OnboardingDay, OnboardingDayHours>;

/**
 * Everything the three steps collect. Declared rather than inferred from
 * `DEFAULT_FORM_DATA`, whose `planId: null` would otherwise infer as the type
 * `null` and make every assignment to it fail.
 */
export interface OnboardingFormData {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  region: string;
  city: string;
  logo: string;
  planId: string | null;
  workingHours: OnboardingWorkingHours;
}

/** Each step merges its own slice of the form; none of them replace it. */
export type UpdateFormData = (updates: Partial<OnboardingFormData>) => void;

/** One row of the working-hours editor. */
export interface WorkingHoursDay {
  key: OnboardingDay;
  label: string;
  short: string;
}

/** One entry in the step indicator row. */
export interface WizardStep {
  id: number;
  name: string;
  icon: LucideIcon;
  description: string;
}

/** The plans offered on the plan-selection step. */
export type OnboardingPlan = Awaited<
  ReturnType<typeof getOnboardingData>
>["plans"][number];

/** The signed-in user the wizard is run for. */
export type OnboardingUser = NonNullable<Awaited<ReturnType<typeof checkUser>>>;
