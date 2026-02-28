import { Building2, Mail, Phone, MapPin } from "lucide-react";

export const getInputFields = (values) => [
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
        id: "address",
        label: "Address",
        icon: MapPin,
        placeholder: "123 Main Street, Cairo, Egypt",
        required: true,
        value: values.address,
    },
];
