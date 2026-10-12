"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { asModelYear, replaceYear } from "@/lib/utils/replace-year";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { addCar, updateCarFull } from "@/actions/cars";
import { useActionError } from "@/hooks/use-action-error";
import { useTranslations, useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { useFormatters } from "@/hooks/use-formatters";
import { VALIDATION_RULES } from "@/lib/constants/validation";
import { disclosuresFromForm, disclosuresToForm } from "@/lib/utils/car-disclosures";
import {
    CAR_STEPS,
    createCarFormSchema,
    stepFields,
    type CarFormInitialData,
    type CarFormValues,
    type CarStep,
} from "./car-form-schema";

export { CAR_STEPS, type CarFormInitialData, type CarFormValues, type CarStep } from "./car-form-schema";


export const useCarForm = (
    initialData: CarFormInitialData = {},
    maxImages: number = VALIDATION_RULES.CAR.MAX_IMAGES,
    isEditMode = false,
    carId: string | null = null
) => {
    const [currentStep, setCurrentStep] = useState<CarStep>("photos");
    // The furthest step reached: a new car cannot skip ahead of what it has filled in.
    const [reached, setReached] = useState(isEditMode ? CAR_STEPS.length - 1 : 0);
    const router = useRouter();
    // From the route, not by position in the URL: the path now starts with a
    // locale (/ar/org/<slug>/...), and splitting it took "org" as the slug.
    const { slug } = useParams<{ slug: string }>();

    const t = useTranslations("org.carForm.validation");
    const tForm = useTranslations("org.carForm.form");
    const actionError = useActionError();
    const { number } = useFormatters();
    const locale = useLocale() as Locale;

    // Read once: whether the car arrived with a description in the language
    // the form is NOT showing. Only an edit of an older listing does.
    const hiddenDescription =
        locale === "ar" ? initialData.description : initialData.descriptionAr;
    const otherLanguageDescribed =
        typeof hiddenDescription === "string" &&
        hiddenDescription.trim().length >= VALIDATION_RULES.CAR.DESCRIPTION_MIN_LENGTH;

    const carFormSchema = useMemo(
        () =>
            createCarFormSchema(
                t,
                number,
                locale,
                otherLanguageDescribed,
                maxImages,
                isEditMode
            ),
        [t, number, locale, otherLanguageDescribed, maxImages, isEditMode]
    );
    const resolver = useMemo(() => zodResolver(carFormSchema), [carFormSchema]);

    const form = useForm<CarFormValues>({
        // The schema transforms `features` (string → string[]), so its input and
        // output types differ; the resolver is asserted to the output shape.
        resolver: resolver as Resolver<CarFormValues>,
        // The numeric fields deliberately default to "" so their inputs render
        // empty rather than 0; Zod coerces and validates them on submit. The
        // cast preserves that, rather than changing the rendered defaults.
        defaultValues: {
            title: initialData.title || "",
            make: initialData.make || "",
            model: initialData.model || "",
            year: initialData.year || "",
            price: initialData.price || "",
            mileage: initialData.mileage || 0, // 0 km to start: a field left alone is valid, not an error.
            bodyType: initialData.bodyType || "",
            fuelType: initialData.fuelType || "",
            transmission: initialData.transmission || "",
            color: initialData.color || "",
            seats: initialData.seats || "",
            location: initialData.location || "",
            features: initialData.features || [],
            featuresAr: initialData.featuresAr || [],
            description: initialData.description || "",
            titleAr: initialData.titleAr || "",
            descriptionAr: initialData.descriptionAr || "",
            ...disclosuresToForm(initialData as Parameters<typeof disclosuresToForm>[0]),
            status: initialData.status || "Available",
            featured: initialData.featured || false,
            images: initialData.images || [],
        } as unknown as CarFormValues,
        mode: "onChange",
    });

    const queryClient = useQueryClient();
    
    const { isPending: adding, mutateAsync: addCarFn } = useMutation({
        mutationFn: (payload: { data: CarFormValues; editedLocale: Locale | null }) =>
            addCar(payload.data, { editedLocale: payload.editedLocale }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cars.all });
            // Saving a car made with AI counts it against the AI listings.
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.planUsage("aiProcessing") });
        },
    });

    const { isPending: updating, mutateAsync: updateCarFn } = useMutation({
        // Only mounted in edit mode, where carId is always supplied.
        mutationFn: (payload: { data: CarFormValues; editedLocale: Locale | null }) =>
            updateCarFull(carId!, payload.data, { editedLocale: payload.editedLocale }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cars.all });
            queryClient.invalidateQueries({ queryKey: [...queryKeys.cars.all, carId] });
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.planUsage("aiProcessing") });
        },
    });

    const loading = isEditMode ? updating : adding;

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

    // A corrected year follows into the text that states it — the AI writes
    // "كيا سيراتو ٢٠٢٠" into the title and description. Keyed on the last
    // complete year, so typing through "202" rewrites nothing, and the first
    // one seen (a pre-fill) is only recorded. Not marked dirty: both languages
    // change together, so there is nothing for the server to re-translate.
    const lastYear = useRef<number | null>(null);
    useEffect(() => {
        const year = asModelYear(watchYear);
        if (year === null) return;
        const previous = lastYear.current;
        lastYear.current = year;
        if (previous === null || previous === year) return;
        for (const field of ["titleAr", "description", "descriptionAr"] as const) {
            const text = form.getValues(field);
            if (typeof text !== "string") continue;
            const updated = replaceYear(text, previous, year);
            if (updated !== text) form.setValue(field, updated);
        }
    }, [watchYear, form]);

    // Update form when initialData changes (for AI mode or edit mode pre-fill)
    useEffect(() => {
        if (Object.keys(initialData).length > 0) {
            Object.entries(initialData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (key === "price" && typeof value === "string") {
                        const cleanPrice = value.replace(/[$,+]/g, "");
                        const numPrice = parseFloat(cleanPrice);
                        if (!isNaN(numPrice)) {
                            form.setValue(key as keyof CarFormValues,numPrice);
                        }
                    } else if (key === "features" && typeof value === "string") {
                        const featuresArray = value
                            .split(",")
                            .map((feature) => feature.trim())
                            .filter(Boolean);
                        form.setValue(key as keyof CarFormValues,featuresArray);
                    } else {
                        form.setValue(key as keyof CarFormValues, value as never);
                    }
                }
            });
        }
    }, [initialData, form]);

    const fieldsOf = stepFields(locale);

    /** Check this step, then go on; a step that fails stays put with its errors showing. */
    const handleNext = async () => {
        const index = CAR_STEPS.indexOf(currentStep);
        if (!(await form.trigger(fieldsOf[currentStep]))) return false;
        if (index < CAR_STEPS.length - 1) {
            setCurrentStep(CAR_STEPS[index + 1]);
            setReached((current) => Math.max(current, index + 1));
        }
        return true;
    };

    const handlePrevious = () => {
        const index = CAR_STEPS.indexOf(currentStep);
        if (index > 0) setCurrentStep(CAR_STEPS[index - 1]);
    };

    /** Jump from the rail: any step when editing, one already reached when adding. */
    const goTo = (step: CarStep) => {
        if (CAR_STEPS.indexOf(step) <= reached) setCurrentStep(step);
    };

    /** A save that fails validation opens the first step holding an error. */
    const onInvalid = (errors: Partial<Record<keyof CarFormValues, unknown>>) => {
        const failed = CAR_STEPS.find((step) => fieldsOf[step].some((field) => field in errors));
        if (failed) setCurrentStep(failed);
        toast.error(tForm("validationToastTitle"), { description: tForm("validationToastBody") });
    };

    /** Saves the car; true when it saved, so the caller can let go of its draft. */
    const onSubmit = async (data: CarFormValues): Promise<boolean> => {
        // Defensive only: the schema already transforms a comma-separated
        // `features` string into an array, so by here it never is one.
        const rawFeatures: unknown = data.features;
        if (typeof rawFeatures === 'string') {
            data.features = rawFeatures
                .split(',')
                .map((f) => f.trim())
                .filter(Boolean);
        }

        // The English columns mirror the single-language fields the dealer
        // actually edits, so `titleEn`/`descriptionEn` never drift from what is
        // on screen. The Arabic half comes straight from its own inputs.
        const payload = {
            ...data,
            titleEn: data.title,
            descriptionEn: data.description,
            // Strings on screen, booleans and nulls on the wire: null is
            // "not stated", and sending every field lets a dealer clear one.
            ...disclosuresFromForm(data),
        } as unknown as CarFormValues;

        // Which language the dealer changed in this save. The server rewrites
        // the other one from it; untouched fields (an AI draft that already
        // carries both languages) are left alone rather than re-translated.
        const dirty = form.formState.dirtyFields;
        const editedHere =
            locale === "ar"
                ? dirty.titleAr || dirty.descriptionAr || dirty.featuresAr
                : dirty.description || dirty.features;
        const editedLocale = editedHere ? locale : null;

        const fn = isEditMode ? updateCarFn : addCarFn;
        const response = await fn({ data: payload, editedLocale });
        if (response?.success) {
            toast.success(isEditMode ? tForm("updatedToast") : tForm("addedToast"));
            if (response.data.translation === "skipped") {
                toast.info(tForm("translationSkipped", { other: locale === "ar" ? "en" : "ar" }));
            }
            router.push(`/org/${slug}/cars`);
            return true;
        }
        toast.error(
            actionError(
                response?.error,
                isEditMode ? tForm("updateFailed") : tForm("addFailed")
            )
        );
        return false;
    };

    /** Reopen a saved draft on the step it was left at — or a fresh one at the start. */
    const resume = (step: CarStep, furthest: number) => {
        setCurrentStep(step);
        setReached(isEditMode ? CAR_STEPS.length - 1 : furthest);
    };

    return {
        form,
        currentStep,
        reached,
        loading,
        handlers: {
            handleNext,
            handlePrevious,
            goTo,
            resume,
            onSubmit,
            onInvalid,
        },
    };
};
