import { Building2, Mail, Phone, MapPin, type LucideIcon } from "lucide-react";
import type { OrgDetailsFormValues } from "./useOrgDetails";

/** One text field of the org-details form. */
export interface OrgInputField {
    id: keyof OrgDetailsFormValues;
    label: string;
    icon: LucideIcon;
    placeholder: string;
    type?: string;
    required: boolean;
    value: string | undefined;
}

export const getInputFields = (values: {
    name: string;
    email: string;
    phone: string;
    address: string | undefined;
}): OrgInputField[] => [
    {
        id: "name",
        label: "Dealership Name",
        icon: Building2,
        placeholder: "Cairo Premium Cars",
        required: true,
        value: values.name,
    },
    {
        id: "email",
        label: "Contact Email",
        icon: Mail,
        placeholder: "contact@yourdealership.com",
        type: "email",
        required: true,
        value: values.email,
    },
    {
        id: "phone",
        label: "Phone Number",
        icon: Phone,
        placeholder: "+20 123 456 7890",
        type: "tel",
        required: true,
        value: values.phone,
    },
    {
        // Optional: country/state/city below carry the structured location.
        // This is just the street line, and not every dealership has one worth
        // publishing at signup.
        id: "address",
        label: "Street Address",
        icon: MapPin,
        placeholder: "123 Main Street",
        required: false,
        value: values.address,
    },
];
