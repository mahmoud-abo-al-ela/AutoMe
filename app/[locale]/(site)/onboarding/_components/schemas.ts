import { z } from "zod";
import {
    isEgyptPhone,
    LOCAL_MAX_LENGTH,
    LOCAL_MIN_LENGTH,
} from "@/lib/utils/phone";

/**
 * A translator scoped to `onboarding.orgDetails.validation`, plus the number
 * formatter for the limits it interpolates.
 *
 * The schemas are factories rather than module constants because their messages
 * are translated: a module-level schema would freeze whichever locale happened
 * to load the module first. Same arrangement as `useTestDriveForm`.
 *
 * `n` is passed in rather than left to ICU because next-intl formats numeric
 * arguments against the bare `ar` tag, whose numbering system is Western — a
 * limit rendered that way would read "3" beside Arabic digits everywhere else.
 */
type Translate = (
    key: string,
    values?: Record<string, string | number | Date>
) => string;
type FormatNumber = (value: number) => string;

/** The limits the messages quote, so copy and validation cannot disagree. */
export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 100;
export const ADDRESS_MAX_LENGTH = 240;

// Step 1: Organization Details Schema
export const createOrgDetailsSchema = (t: Translate, n: FormatNumber) =>
    z.object({
        name: z
            .string()
            .min(1, t("nameRequired"))
            .min(NAME_MIN_LENGTH, t("nameTooShort", { min: n(NAME_MIN_LENGTH) }))
            .max(NAME_MAX_LENGTH, t("nameTooLong", { max: n(NAME_MAX_LENGTH) })),
        email: z.string().min(1, t("emailRequired")).email(t("emailInvalid")),
        // Digits only, held as "01001234567". The length bounds are the local
        // form's, which is what the reader is looking at while they read the
        // message. See lib/utils/phone.
        phone: z
            .string()
            .min(1, t("phoneRequired"))
            .refine(
                isEgyptPhone,
                t("phoneInvalid", {
                    min: n(LOCAL_MIN_LENGTH),
                    max: n(LOCAL_MAX_LENGTH),
                })
            ),
        // Street line only — the structured location lives in country/region/city
        // below, and not every dealership has a street address worth publishing.
        address: z
            .string()
            .max(ADDRESS_MAX_LENGTH, t("addressTooLong", { max: n(ADDRESS_MAX_LENGTH) }))
            .optional()
            .or(z.literal("")),
        country: z.string().min(1, t("countryRequired")),
        region: z.string().min(1, t("regionRequired")),
        city: z.string().min(1, t("cityRequired")),
        logo: z.string().min(1, t("logoRequired")),
    });

// Step 3: Plan Selection Schema
export const createPlanSelectionSchema = (t: Translate) =>
    z.object({
        planId: z.string().min(1, t("planRequired")),
    });

// Step 2: Working Hours Schema. No messages: every field is a control the user
// cannot leave in an invalid state.
const dayHoursSchema = z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean(),
});

export const workingHoursSchema = z.object({
    workingHours: z.object({
        saturday: dayHoursSchema,
        sunday: dayHoursSchema,
        monday: dayHoursSchema,
        tuesday: dayHoursSchema,
        wednesday: dayHoursSchema,
        thursday: dayHoursSchema,
        friday: dayHoursSchema,
    }),
});
