"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { workingHoursSchema } from "../schemas";

export function useWorkingHours({ formData, updateFormData, onNext }) {
    const [loading, setLoading] = useState(false);

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(workingHoursSchema),
        mode: "onChange",
        defaultValues: {
            workingHours: formData.workingHours,
        },
    });

    const workingHours = watch("workingHours");

    const onSubmit = (data) => {
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
