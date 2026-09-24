"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { addCar, updateCarFull } from "@/actions/cars";
import { useTranslations, useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { useFormatters } from "@/hooks/use-formatters";
import { VALIDATION_RULES } from "@/lib/constants/validation";

/**
 * A translator scoped to `org.carForm.validation`, plus the number formatter
 * for the limits its messages quote.
 *
 * The schema is a factory rather than a module constant because its messages
 * are translated: a module-level schema would freeze whichever locale loaded
 * the module first. Same arrangement as the onboarding schemas.
 *
 * `n` is passed rather than left to ICU because next-intl formats numeric
 * arguments against the bare `ar` tag, whose numbering system is Western — a
 * limit rendered that way would read "1900" beside Arabic digits everywhere
 * else on the form.
 */
type Translate = (
    key: string,
    values?: Record<string, string | number | Date>
) => string;
type FormatNumber = (value: number) => string;

/**
 * The form shows the listing text of the dashboard's language only; the other
 * language is written by translation when the car is saved. So the description
 * required is the one on screen — unless the car already carries one in the
 * other language (an older listing opened in edit mode), which is enough to
 * save and gets translated across.
 */
const describedIn = (
    t: Translate,
    n: FormatNumber,
    required: boolean
) => {
    const text = z.string().max(2000);
    return required
        ? text.min(
              VALIDATION_RULES.CAR.DESCRIPTION_MIN_LENGTH,
              t("descriptionTooShort", {
                  min: n(VALIDATION_RULES.CAR.DESCRIPTION_MIN_LENGTH),
              })
          )
        : text.optional();
};

const createCarFormSchema = (
    t: Translate,
    n: FormatNumber,
    locale: Locale,
    otherLanguageDescribed: boolean,
    maxImages = VALIDATION_RULES.CAR.MAX_IMAGES,
    isEditMode = false
) =>
    z.object({
        // English, generated from make/model/year below; never typed.
        title: z.string().min(1, t("titleRequired")),
        titleAr: z.string().max(200).optional(),
        description: describedIn(t, n, locale === "en" && !otherLanguageDescribed),
        descriptionAr: describedIn(t, n, locale === "ar" && !otherLanguageDescribed),
        make: z.string().min(1, t("makeRequired")),
        model: z.string().min(1, t("modelRequired")),
        year: z
            .number()
            .refine(
                (val) => val >= VALIDATION_RULES.CAR.YEAR_MIN && val <= VALIDATION_RULES.CAR.YEAR_MAX,
                t("yearInvalid", {
                    min: n(VALIDATION_RULES.CAR.YEAR_MIN),
                    max: n(VALIDATION_RULES.CAR.YEAR_MAX),
                })
            ),
        price: z
            .number()
            .min(
                VALIDATION_RULES.CAR.PRICE_MIN,
                t("priceInvalid", { min: n(VALIDATION_RULES.CAR.PRICE_MIN - 1) })
            ),
        mileage: z
            .number()
            .min(
                VALIDATION_RULES.CAR.MILEAGE_MIN,
                t("mileageInvalid", { min: n(VALIDATION_RULES.CAR.MILEAGE_MIN) })
            ),
        bodyType: z.string().min(1, t("bodyTypeRequired")),
        fuelType: z.string().min(1, t("fuelTypeRequired")),
        transmission: z.string().min(1, t("transmissionRequired")),
        color: z.string().min(1, t("colorRequired")),
        seats: z
            .number()
            .min(
                VALIDATION_RULES.CAR.SEATS_MIN,
                t("seatsInvalid", {
                    min: n(VALIDATION_RULES.CAR.SEATS_MIN),
                    max: n(VALIDATION_RULES.CAR.SEATS_MAX),
                })
            ),
        location: z.string().min(1, t("locationRequired")),
        features: z.union([
            z.array(z.string()),
            z.string().transform(val => val.split(',').map(f => f.trim()).filter(Boolean))
        ]).optional(),
        // The Arabic list splits on the Arabic comma too: it is what an Arabic
        // keyboard types, and splitting on "," alone would keep the whole list
        // as one feature.
        featuresAr: z.union([
            z.array(z.string()),
            z.string().transform(val => val.split(/[,،]/).map(f => f.trim()).filter(Boolean))
        ]).optional(),
        status: z.enum(["Available", "Sold", "Unavailable"]),
        featured: z.boolean().default(false),
        images: z
            .array(isEditMode ? z.union([z.instanceof(File), z.string()]) : z.instanceof(File))
            .min(VALIDATION_RULES.CAR.MIN_IMAGES, t("imagesRequired"))
            .max(maxImages, t("imagesTooMany", { max: n(maxImages) })),
    });

/** The form's validated shape, inferred from the schema factory. */
export type CarFormValues = z.infer<ReturnType<typeof createCarFormSchema>>;

/**
 * Pre-fill for the form: any subset of the form fields, plus the loose
 * string-shaped values the AI extraction path supplies (price and features
 * arrive as strings and are coerced in the effect below).
 */
export type CarFormInitialData = Partial<
  Record<keyof CarFormValues, unknown>
>;

/** Section ids, in order. The labels live in `org.carForm.sections`, keyed by
 * id, so the stepper and the section headings read one source. */
const formSections = [
    { id: "basic" },
    { id: "specs" },
    { id: "details" },
    { id: "status" },
] as const;

export const useCarForm = (
    initialData: CarFormInitialData = {},
    maxImages: number = VALIDATION_RULES.CAR.MAX_IMAGES,
    isEditMode = false,
    carId: string | null = null
) => {
    const [currentSection, setCurrentSection] = useState("basic");
    const router = useRouter();

    const t = useTranslations("org.carForm.validation");
    const tForm = useTranslations("org.carForm.form");
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
            mileage: initialData.mileage || "",
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
        },
    });

    const { isPending: updating, mutateAsync: updateCarFn } = useMutation({
        // Only mounted in edit mode, where carId is always supplied.
        mutationFn: (payload: { data: CarFormValues; editedLocale: Locale | null }) =>
            updateCarFull(carId!, payload.data, { editedLocale: payload.editedLocale }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cars.all });
            queryClient.invalidateQueries({ queryKey: [...queryKeys.cars.all, carId] });
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

    const validateSection = async (sectionId: string) => {
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
            // The description on screen is the dashboard language's one.
            isValid = await form.trigger([
                locale === "ar" ? "descriptionAr" : "description",
                "location",
                "images",
            ]);
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
            toast.error(tForm("validationToastTitle"), {
                description: tForm("validationToastBody"),
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

    const onSubmit = async (data: CarFormValues) => {
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
        } as CarFormValues;

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
            const slug = window.location.pathname.split('/')[2];
            router.push(`/org/${slug}/cars`);
        } else {
            // The action's own message wins when it sent one; otherwise the
            // translated fallback. Same order as resolveActionError.
            const errorMessage =
                response?.error?.message ||
                (isEditMode ? tForm("updateFailed") : tForm("addFailed"));
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
