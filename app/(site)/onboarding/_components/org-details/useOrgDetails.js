"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkSlugAvailability } from "@/actions/onboarding";
import { orgDetailsSchema } from "../schemas";

export function useOrgDetails({ formData, updateFormData, onNext }) {
    const [slugStatus, setSlugStatus] = useState(null);
    const [generatedSlug, setGeneratedSlug] = useState("");
    const [slugCheckTimeout, setSlugCheckTimeout] = useState(null);
    const [logo, setLogo] = useState(formData.logo || "");
    const [logoError, setLogoError] = useState("");

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(orgDetailsSchema),
        mode: "onChange",
        defaultValues: {
            name: formData.name || "",
            email: formData.email || "",
            phone: formData.phone || "",
            address: formData.address || "",
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

    const generateSlug = (name) => {
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
                setSlugStatus(result.available ? "available" : "taken");
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

    const onSubmit = (data) => {
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
        !watchedAddress?.trim() ||
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
        logo,
        setLogo,
        logoError,
    };
}
