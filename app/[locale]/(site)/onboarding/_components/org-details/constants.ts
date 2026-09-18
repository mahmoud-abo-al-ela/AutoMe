import { Building2, Mail, Phone, MapPin, type LucideIcon } from "lucide-react";
import { toLocalEgyptPhone, toPhoneField } from "@/lib/utils/phone";
import type { OrgDetailsFormValues } from "./useOrgDetails";

/**
 * One text field of the org-details form.
 *
 * Icons, order and input semantics only. The label and placeholder live in
 * messages/{en,ar}/onboarding.json under `orgDetails.fields`, keyed by `id`.
 */
export interface OrgInputField {
    id: keyof OrgDetailsFormValues;
    icon: LucideIcon;
    type?: string;
    required: boolean;
    value: string | undefined;
    /** Rewrites what the user typed before it reaches the form state. */
    normalize?: (value: string) => string;
    /**
     * Rewrites what is *shown* as it is typed — rejecting characters the field
     * does not take, or changing the ones it does. The caret is carried across
     * the rewrite, so it may shorten the value.
     */
    display?: (value: string) => string;
}

export const getInputFields = (values: {
    name: string;
    email: string;
    phone: string;
    address: string | undefined;
}): OrgInputField[] => [
    {
        id: "name",
        icon: Building2,
        required: true,
        value: values.name,
    },
    {
        id: "email",
        icon: Mail,
        type: "email",
        required: true,
        value: values.email,
    },
    {
        // Egypt-only product, so the number is held the way it is written here
        // — "01001234567" — and a pasted country code is reduced to it.
        id: "phone",
        icon: Phone,
        type: "tel",
        required: true,
        value: values.phone,
        normalize: toLocalEgyptPhone,
        // Digits only, Western, and no longer than an Egyptian number gets: a
        // phone number is dialled and pasted rather than read as prose, so it
        // does not follow the locale the way every other number in the product
        // does. Separators are dropped as they are typed — see lib/utils/phone.
        display: toPhoneField,
    },
    {
        // Optional: country/state/city below carry the structured location.
        // This is just the street line, and not every dealership has one worth
        // publishing at signup.
        id: "address",
        icon: MapPin,
        required: false,
        value: values.address,
    },
];
