"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { workingHoursSchema } from "../schemas";
import type { z } from "zod";
import type {
    OnboardingFormData,
    UpdateFormData,
} from "../../_lib/onboarding-types";

/** Step 2 edits only the working-hours slice of the wizard's form data. */
export type WorkingHoursFormValues = z.infer<typeof workingHoursSchema>;

export function useWorkingHours({
    formData,
    updateFormData,
    onNext,
}: {
    formData: OnboardingFormData;
    updateFormData: UpdateFormData;
    onNext: () => void;
}) {
    const [loading] = useState(false);

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<WorkingHoursFormValues>({
        resolver: zodResolver(workingHoursSchema),
        mode: "onChange",
        defaultValues: {
            workingHours: formData.workingHours,
        },
    });

    const workingHours = watch("workingHours");

    const onSubmit = (data: WorkingHoursFormValues) => {
        updateFormData(data);
        onNext();
    };

    return {
        control,
        handleSubmit,
        workingHours,
        errors,
        loading,
        onSubmit,
    };
}
