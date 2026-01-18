"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { addCar } from "@/actions/cars";
import { VALIDATION_RULES, ERROR_MESSAGES } from "@/lib/constants/validation";

const carFormSchema = z.object({
    title: z.string().min(1, ERROR_MESSAGES.CAR.TITLE_REQUIRED),
    make: z.string().min(1, ERROR_MESSAGES.CAR.MAKE_REQUIRED),
    model: z.string().min(1, ERROR_MESSAGES.CAR.MODEL_REQUIRED),
    year: z
        .number()
        .refine(
            (val) => val >= VALIDATION_RULES.CAR.YEAR_MIN && val <= VALIDATION_RULES.CAR.YEAR_MAX,
            ERROR_MESSAGES.CAR.YEAR_INVALID
        ),
    price: z.number().min(VALIDATION_RULES.CAR.PRICE_MIN, ERROR_MESSAGES.CAR.PRICE_INVALID),
    mileage: z.number().min(VALIDATION_RULES.CAR.MILEAGE_MIN, ERROR_MESSAGES.CAR.MILEAGE_INVALID),
    bodyType: z.string().min(1, ERROR_MESSAGES.CAR.BODY_TYPE_REQUIRED),
    fuelType: z.string().min(1, ERROR_MESSAGES.CAR.FUEL_TYPE_REQUIRED),
    transmission: z.string().min(1, ERROR_MESSAGES.CAR.TRANSMISSION_REQUIRED),
    color: z.string().min(1, ERROR_MESSAGES.CAR.COLOR_REQUIRED),
    seats: z.number().min(VALIDATION_RULES.CAR.SEATS_MIN, ERROR_MESSAGES.CAR.SEATS_INVALID),
    location: z.string().min(1, ERROR_MESSAGES.CAR.LOCATION_REQUIRED),
    features: z.union([
        z.array(z.string()),
        z.string().transform(val => val.split(',').map(f => f.trim()).filter(Boolean))
    ]).optional(),
    description: z.string().min(VALIDATION_RULES.CAR.DESCRIPTION_MIN_LENGTH, ERROR_MESSAGES.CAR.DESCRIPTION_TOO_SHORT),
    status: z.enum(["Available", "Sold", "Unavailable"]),
    featured: z.boolean().default(false),
    images: z
        .array(z.instanceof(File))
        .min(VALIDATION_RULES.CAR.MIN_IMAGES, ERROR_MESSAGES.CAR.IMAGES_REQUIRED)
        .max(VALIDATION_RULES.CAR.MAX_IMAGES, ERROR_MESSAGES.CAR.IMAGES_TOO_MANY),
});

const formSections = [
    { id: "basic", label: "Basic Info" },
    { id: "specs", label: "Specifications" },
    { id: "details", label: "Additional Details" },
    { id: "status", label: "Status & Visibility" },
];

export const useCarForm = (initialData = {}) => {
    const [currentSection, setCurrentSection] = useState("basic");
    const router = useRouter();

    const form = useForm({
        resolver: zodResolver(carFormSchema),
        defaultValues: {
            title: initialData.title || "",
            make: initialData.make || "",
            model: initialData.model || "",
            year: initialData.year || "",
            price: initialData.price || "",
            mileage: initialData.mileage || "",
            bodyType: initialData.bodyType || "",
            fuelType: initialData.fuelType || "",
            transmission: initialData.transmission || "",
            color: initialData.color || "",
            seats: initialData.seats || "",
            location: initialData.location || "",
            features: initialData.features || [],
            description: initialData.description || "",
            status: initialData.status || "Available",
            featured: initialData.featured || false,
            images: initialData.images || [],
        },
        mode: "onChange",
    });

    const { loading, fn } = useFetch(addCar);

    const watchMake = form.watch("make");
    const watchModel = form.watch("model");
    const watchYear = form.watch("year");

    // Auto-generate title
    useEffect(() => {
        if (watchMake && watchModel && watchYear) {
            const generatedTitle = `${watchMake} ${watchModel} ${watchYear}`;
            form.setValue("title", generatedTitle, { shouldValidate: true });
        } else {
            form.setValue("title", "");
        }
    }, [watchMake, watchModel, watchYear, form]);

    // Update form when initialData changes (for AI mode)
    useEffect(() => {
        if (Object.keys(initialData).length > 0) {
            Object.entries(initialData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (key === "price" && typeof value === "string") {
                        const cleanPrice = value.replace(/[$,+]/g, "");
                        const numPrice = parseFloat(cleanPrice);
                        if (!isNaN(numPrice)) {
                            form.setValue(key, numPrice);
                        }
                    } else if (key === "features" && typeof value === "string") {
                        const featuresArray = value
                            .split(",")
                            .map((feature) => feature.trim())
                            .filter(Boolean);
                        form.setValue(key, featuresArray);
                    } else {
                        form.setValue(key, value);
                    }
                }
            });
        }
    }, [initialData, form]);

    const validateSection = async (sectionId) => {
        let isValid = true;

        if (sectionId === "basic") {
            const titleValue = form.getValues("title");
            if (!titleValue || titleValue.trim() === "") {
                form.setValue("title", "", { shouldValidate: true });
            }
            isValid = await form.trigger([
                "make",
                "model",
                "year",
                "title",
                "price",
                "mileage",
            ]);
        } else if (sectionId === "specs") {
            isValid = await form.trigger([
                "bodyType",
                "fuelType",
                "transmission",
                "color",
                "seats",
            ]);
        } else if (sectionId === "details") {
            isValid = await form.trigger(["description", "location", "images"]);
        }

        return isValid;
    };

    const handleNext = async () => {
        const currentIndex = formSections.findIndex((s) => s.id === currentSection);

        if (await validateSection(currentSection)) {
            if (currentIndex < formSections.length - 1) {
                setCurrentSection(formSections[currentIndex + 1].id);
            }
        } else {
            toast.error("Please complete all required fields", {
                description: "Fill in the highlighted fields to proceed",
                className: "text-sm",
            });
        }
    };

    const handlePrevious = () => {
        const currentIndex = formSections.findIndex((s) => s.id === currentSection);
        if (currentIndex > 0) {
            setCurrentSection(formSections[currentIndex - 1].id);
        }
    };

    const onSubmit = async (data) => {
        if (typeof data.features === 'string') {
            data.features = data.features
                .split(',')
                .map(f => f.trim())
                .filter(Boolean);
        }

        const response = await fn({ data });
        if (response?.success) {
            toast.success("Car added successfully");
            const slug = window.location.pathname.split('/')[2];
            router.push(`/org/${slug}/cars`);
        } else {
            const errorMessage = response?.error || "Failed to add car";
            toast.error(errorMessage);
        }
    };


    return {
        form,
        currentSection,
        formSections,
        loading,
        handlers: {
            handleNext,
            handlePrevious,
            onSubmit,
        },
    };
};
