import {
    Building2,
    CreditCard,
    Clock,
} from "lucide-react";
import type {
    OnboardingFormData,
    WizardStep,
} from "../../_lib/onboarding-types";

export const STEPS: WizardStep[] = [
    { id: 1, key: "organization", icon: Building2 },
    { id: 2, key: "workingHours", icon: Clock },
    { id: 3, key: "plan", icon: CreditCard },
];

export const DEFAULT_FORM_DATA: OnboardingFormData = {
    name: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    country: "EG",
    region: "",
    city: "",
    logo: "",
    planId: null,
    // The Egyptian week runs Saturday to Friday and the weekly holiday is
    // Friday, so that is the day pre-set to closed. The defaults used to close
    // Sunday and open Friday, which is the American week — a dealer who never
    // touched this step published hours that were wrong on both ends.
    workingHours: {
        saturday: { open: "10:00", close: "16:00", closed: false },
        sunday: { open: "09:00", close: "18:00", closed: false },
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "10:00", close: "16:00", closed: true },
    },
};
