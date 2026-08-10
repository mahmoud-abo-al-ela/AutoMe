import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { planSelectionSchema } from "../schemas";
import { createCheckoutSession } from "@/actions/payment";
import { createOrganization, saveOnboardingFormData } from "@/actions/onboarding";

export function usePlanSelection({
    plans,
    formData,
    updateFormData,
    userId,
}) {
    const router = useRouter();
    const {
        setValue,
        watch,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(planSelectionSchema),
        mode: "onChange",
        defaultValues: {
            planId: formData.planId || "",
        },
    });

    const selectedPlanId = watch("planId");
    const [loading, setLoading] = useState(false);
    const [billingPeriod, setBillingPeriod] = useState("monthly");

    // Calculate average savings percentage from paid plans
    const calculateSavingsPercentage = () => {
        const paidPlans = plans.filter(
            (plan) => plan.monthlyPrice > 0 && plan.monthlyPrice !== null
        );

        if (paidPlans.length === 0) return 0;

        const totalSavings = paidPlans.reduce((sum, plan) => {
            const monthlyTotal = plan.monthlyPrice * 12;
            const yearlyPrice = plan.yearlyPrice || plan.monthlyPrice * 12 * 0.8;
            const savings = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100;
            return sum + savings;
        }, 0);

        return Math.round(totalSavings / paidPlans.length);
    };

    const savingsPercentage = calculateSavingsPercentage();

    const handleSelectPlan = (planId) => {
        setValue("planId", planId, { shouldValidate: true });
    };

    const handleCreateOrg = async () => {
        setLoading(true);
        try {
            const result = await createOrganization({
                ...formData,
                planId: selectedPlanId,
                userId,
                billingPeriod,
            });

            if (result.success) {
                updateFormData({ planId: selectedPlanId, billingPeriod });
                // Redirect to dashboard with onboarding complete flag
                router.push(`/org/${result.data.organization.slug}/dashboard?onboarding=complete`);
            } else {
                toast.error(result.error?.message || "Failed to create organization");
            }
        } catch (error) {
            console.error("Error creating organization:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        const plan = plans.find((p) => p.id === data.planId);
        if (!plan) return;

        if (plan.monthlyPrice === 0) {
            // Free plan — create org directly, then redirect to dashboard
            await handleCreateOrg();
        } else {
            // Paid plan — save form data, redirect to Stripe Checkout
            setLoading(true);
            try {
                // 1. Save onboarding data to server
                const sessionRes = await saveOnboardingFormData({
                    ...formData,
                    planId: selectedPlanId,
                    billingPeriod,
                });

                if (!sessionRes.success) {
                    toast.error(sessionRes.error?.message || "Failed to save onboarding data");
                    setLoading(false);
                    return;
                }

                // 2. Create Stripe Checkout Session
                const res = await createCheckoutSession(
                    plan.id,
                    billingPeriod,
                    sessionRes.data.sessionId,
                );

                if (res.success) {
                    // 3. Redirect to Stripe Checkout
                    window.location.href = res.data.url;
                } else {
                    toast.error(res.error?.message || "Failed to initiate payment");
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error initiating checkout:", error);
                toast.error("An unexpected error occurred. Please try again.");
                setLoading(false);
            }
        }
    };

    return {
        selectedPlanId,
        loading,
        errors,
        billingPeriod,
        savingsPercentage,
        handleSelectPlan,
        handleSubmit: handleSubmit(onSubmit),
        setBillingPeriod,
    };
}
