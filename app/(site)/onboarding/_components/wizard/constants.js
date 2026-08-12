import {
    Building2,
    CreditCard,
    Clock,
} from "lucide-react";

export const STEPS = [
    {
        // Names stay short enough to hold one line at the indicator's width.
        // "Organization Details" wrapped, which pushed its description a line
        // below the other two and made the row look broken.
        id: 1,
        name: "Organization",
        icon: Building2,
        description: "Basic info",
    },
    { id: 2, name: "Working Hours", icon: Clock, description: "Availability" },
    { id: 3, name: "Select Plan", icon: CreditCard, description: "Choose tier" },
];

export const DEFAULT_FORM_DATA = {
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
    workingHours: {
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "18:00", closed: false },
        saturday: { open: "10:00", close: "16:00", closed: false },
        sunday: { open: "10:00", close: "16:00", closed: true },
    },
};
