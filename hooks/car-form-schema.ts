import { z } from "zod";
import type { Locale } from "@/i18n/routing";
import { VALIDATION_RULES } from "@/lib/constants/validation";
import { SERVICE_HISTORY, UNSET } from "@/lib/utils/car-disclosures";

/**
 * The car editor's form: its localized Zod schema, the values it holds, and
 * the steps it is filled in by. useCarForm (use-car-form.ts) drives it.
 */

/** A yes / no / not-stated select, as the form holds it. */
const triState = z.enum([UNSET, "yes", "no"]).default(UNSET);

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
type FormatNumber = (value: number, options?: Intl.NumberFormatOptions) => string;

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

export const createCarFormSchema = (
    t: Translate,
    n: FormatNumber,
    locale: Locale,
    otherLanguageDescribed: boolean,
    maxImages = VALIDATION_RULES.CAR.MAX_IMAGES,
    isEditMode = false
) => {
    // An empty number input reaches the schema as NaN (valueAsNumber) or "";
    // either is the same mistake as an out-of-range value, and says so.
    const numberField = (message: string) => z.number({ invalid_type_error: message, required_error: message });
    // Years read as years: "1900", never "1,900".
    const yearMessage = t("yearInvalid", {
        min: n(VALIDATION_RULES.CAR.YEAR_MIN, { useGrouping: false }),
        max: n(VALIDATION_RULES.CAR.YEAR_MAX, { useGrouping: false }),
    });
    const priceMessage = t("priceInvalid", { min: n(VALIDATION_RULES.CAR.PRICE_MIN - 1) });
    const mileageMessage = t("mileageInvalid", { min: n(VALIDATION_RULES.CAR.MILEAGE_MIN) });
    const seatsMessage = t("seatsInvalid", { min: n(VALIDATION_RULES.CAR.SEATS_MIN), max: n(VALIDATION_RULES.CAR.SEATS_MAX) });

    return z.object({
        // English, generated from make/model/year below; never typed.
        title: z.string().min(1, t("titleRequired")),
        titleAr: z.string().max(200).optional(),
        description: describedIn(t, n, locale === "en" && !otherLanguageDescribed),
        descriptionAr: describedIn(t, n, locale === "ar" && !otherLanguageDescribed),
        make: z.string().min(1, t("makeRequired")),
        model: z.string().min(1, t("modelRequired")),
        year: numberField(yearMessage).refine(
            (val) => val >= VALIDATION_RULES.CAR.YEAR_MIN && val <= VALIDATION_RULES.CAR.YEAR_MAX,
            yearMessage
        ),
        price: numberField(priceMessage).min(VALIDATION_RULES.CAR.PRICE_MIN, priceMessage),
        mileage: numberField(mileageMessage).min(VALIDATION_RULES.CAR.MILEAGE_MIN, mileageMessage),
        bodyType: z.string().min(1, t("bodyTypeRequired")),
        fuelType: z.string().min(1, t("fuelTypeRequired")),
        transmission: z.string().min(1, t("transmissionRequired")),
        color: z.string().min(1, t("colorRequired")),
        seats: numberField(seatsMessage).min(VALIDATION_RULES.CAR.SEATS_MIN, seatsMessage),
        // Not asked for: a car is where its dealership is. Carried through
        // unchanged so an older car keeps the text it was saved with.
        location: z.string().optional(),
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
        // History and condition: all optional, and "not stated" is a real
        // answer — see lib/utils/car-disclosures.
        originalPaint: triState,
        accidentFree: triState,
        ownerCount: z.string().default(UNSET),
        serviceHistory: z.enum([UNSET, ...SERVICE_HISTORY]).default(UNSET),
        priceNegotiable: triState,
        licenseValidUntil: z.string().regex(/^(\d{4}-\d{2})?$/).default(""),
        status: z.enum(["Available", "Sold", "Unavailable"]),
        featured: z.boolean().default(false),
        images: z
            .array(isEditMode ? z.union([z.instanceof(File), z.string()]) : z.instanceof(File))
            .min(VALIDATION_RULES.CAR.MIN_IMAGES, t("imagesRequired"))
            .max(maxImages, t("imagesTooMany", { max: n(maxImages) })),
    });
};

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

/**
 * The editor's steps, in order (canvas: Car editor — round 1, B · Guided
 * steps), and the fields each one asks for. A step's fields are what it
 * validates before moving on, and where a failed save sends the dealer back
 * to. The labels live in `org.carForm.editor.steps`, keyed by id.
 */
export const CAR_STEPS = ["photos", "car", "history", "publish"] as const;
export type CarStep = (typeof CAR_STEPS)[number];

export const stepFields = (locale: Locale): Record<CarStep, (keyof CarFormValues)[]> => ({
    photos: ["images"],
    car: ["make", "model", "year", "title", "mileage", "bodyType", "fuelType", "transmission", "color", "seats", "features", "featuresAr"],
    history: ["originalPaint", "accidentFree", "ownerCount", "serviceHistory", "licenseValidUntil"],
    publish: ["price", "priceNegotiable", "titleAr", locale === "ar" ? "descriptionAr" : "description", "status", "featured"],
});
