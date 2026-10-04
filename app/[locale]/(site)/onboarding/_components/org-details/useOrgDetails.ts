"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { checkSlugAvailability } from "@/actions/onboarding";
import { toLocalEgyptPhone } from "@/lib/utils/phone";
import { isValidSlug, normalizeSlugInput, slugFromName } from "@/lib/utils/slug";
import { createOrgDetailsSchema } from "../schemas";
import type { z } from "zod";
import type {
    OnboardingFormData,
    OnboardingLocationPatch,
    SlugStatus,
    UpdateFormData,
} from "../../_lib/onboarding-types";

/** Step 1's own slice of the wizard's form data. */
export type OrgDetailsFormValues = z.infer<
    ReturnType<typeof createOrgDetailsSchema>
>;

export function useOrgDetails({
    formData,
    updateFormData,
    onNext,
}: {
    formData: OnboardingFormData;
    updateFormData: UpdateFormData;
    onNext: () => void;
}) {
    const t = useTranslations("onboarding.orgDetails.validation");
    const fmt = useFormatters();

    // Rebuilt when the language changes: a schema held at module scope would
    // keep whichever locale first imported it, so a reader who switched
    // languages mid-form would go on seeing the old one's errors.
    const orgDetailsSchema = useMemo(
        () => createOrgDetailsSchema(t, fmt.number),
        [t, fmt]
    );

    const [slugStatus, setSlugStatus] = useState<SlugStatus>(null);
    // The slug follows the name until the dealer types their own. A saved
    // slug that differs from the name's suggestion was typed, so coming back
    // to this step keeps it rather than regenerating over it.
    const [slug, setSlug] = useState(formData.slug || "");
    const [slugEdited, setSlugEdited] = useState(
        Boolean(formData.slug) &&
            formData.slug !== slugFromName(formData.name || "")
    );
    const [logo, setLogo] = useState(formData.logo || "");
    const [logoError, setLogoError] = useState("");

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<OrgDetailsFormValues>({
        resolver: zodResolver(orgDetailsSchema),
        mode: "onChange",
        defaultValues: {
            name: formData.name || "",
            email: formData.email || "",
            // Re-normalised on the way in, so a number stored in some older
            // shape (with a country code, say) still opens in this one.
            phone: toLocalEgyptPhone(formData.phone || ""),
            address: formData.address || "",
            country: formData.country || "EG",
            region: formData.region || "",
            city: formData.city || "",
            logo: formData.logo || "",
        },
    });

    // Sync logo state with form
    useEffect(() => {
        setValue("logo", logo, { shouldValidate: true });
        if (logo) {
            setLogoError("");
        }
    }, [logo, setValue]);

    const watchedName = watch("name");
    const watchedEmail = watch("email");
    const watchedPhone = watch("phone");
    const watchedAddress = watch("address");
    const location = {
        country: watch("country"),
        region: watch("region"),
        city: watch("city"),
    };

    // LocationFields hands back a partial patch (picking a country clears the
    // state and city beneath it), so apply whatever keys it sends.
    const updateLocation = (patch: OnboardingLocationPatch) => {
        (Object.keys(patch) as (keyof OnboardingLocationPatch)[]).forEach((key) => {
            setValue(key, patch[key] ?? "", { shouldValidate: true });
        });
    };

    // Suggested from the name's Latin letters. An all-Arabic name suggests
    // nothing, and the dealer types the address instead — see lib/utils/slug.
    useEffect(() => {
        if (!slugEdited) setSlug(slugFromName(watchedName || ""));
    }, [watchedName, slugEdited]);

    const onSlugChange = (value: string) => {
        setSlugEdited(true);
        setSlug(normalizeSlugInput(value));
    };

    useEffect(() => {
        if (!slug) {
            setSlugStatus(null);
            return;
        }
        if (!isValidSlug(slug)) {
            setSlugStatus("invalid");
            return;
        }

        setSlugStatus("checking");
        let cancelled = false;
        const timeout = setTimeout(async () => {
            const result = await checkSlugAvailability(slug);
            if (cancelled) return;
            // `available` lives under the ActionResponse envelope; reading
            // it off the top level made every name report as taken.
            setSlugStatus(
                result.success && result.data.available ? "available" : "taken"
            );
        }, 500);

        return () => {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, [slug]);

    const onSubmit = (data: OrgDetailsFormValues) => {
        if (slugStatus !== "available") {
            return;
        }
        if (!logo) {
            setLogoError(t("logoRequired"));
            return;
        }
        updateFormData({ ...data, slug, logo });
        onNext();
    };

    const isDisabled =
        slugStatus !== "available" ||
        !watchedName?.trim() ||
        !watchedEmail?.trim() ||
        !watchedPhone?.trim() ||
        !location.country ||
        !location.region ||
        !location.city ||
        !logo;

    return {
        register,
        handleSubmit,
        errors,
        slugStatus,
        slug,
        onSlugChange,
        onSubmit,
        isDisabled,
        watchedName,
        watchedEmail,
        watchedPhone,
        watchedAddress,
        location,
        updateLocation,
        logo,
        setLogo,
        logoError,
    };
}
