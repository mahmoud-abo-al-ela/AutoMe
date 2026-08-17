"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkSlugAvailability } from "@/actions/onboarding";
import { orgDetailsSchema } from "../schemas";
import type { z } from "zod";
import type {
    OnboardingFormData,
    OnboardingLocationPatch,
    SlugStatus,
    UpdateFormData,
} from "../../_lib/onboarding-types";

/** Step 1's own slice of the wizard's form data. */
export type OrgDetailsFormValues = z.infer<typeof orgDetailsSchema>;

export function useOrgDetails({
    formData,
    updateFormData,
    onNext,
}: {
    formData: OnboardingFormData;
    updateFormData: UpdateFormData;
    onNext: () => void;
}) {
    const [slugStatus, setSlugStatus] = useState<SlugStatus>(null);
    const [generatedSlug, setGeneratedSlug] = useState("");
    const [slugCheckTimeout, setSlugCheckTimeout] =
        useState<ReturnType<typeof setTimeout> | null>(null);
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
            phone: formData.phone || "",
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

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .substring(0, 50);
    };

    useEffect(() => {
        if (slugCheckTimeout) clearTimeout(slugCheckTimeout);

        if (watchedName && watchedName.length >= 3) {
            const slug = generateSlug(watchedName);
            setGeneratedSlug(slug);
            setSlugStatus("checking");

            const timeout = setTimeout(async () => {
                const result = await checkSlugAvailability(slug);
                // `available` lives under the ActionResponse envelope; reading
                // it off the top level made every name report as taken.
                setSlugStatus(
                    result.success && result.data.available ? "available" : "taken"
                );
            }, 500);
            setSlugCheckTimeout(timeout);
        } else {
            setGeneratedSlug("");
            setSlugStatus(null);
        }

        return () => {
            if (slugCheckTimeout) clearTimeout(slugCheckTimeout);
        };
    }, [watchedName]);

    const onSubmit = (data: OrgDetailsFormValues) => {
        if (slugStatus === "taken" || !generatedSlug) {
            return;
        }
        if (!logo) {
            setLogoError("Please upload a logo for your dealership");
            return;
        }
        updateFormData({ ...data, slug: generatedSlug, logo });
        onNext();
    };

    const isDisabled =
        slugStatus === "checking" ||
        slugStatus === "taken" ||
        !generatedSlug ||
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
        generatedSlug,
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
