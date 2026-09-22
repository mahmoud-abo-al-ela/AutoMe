import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useActionError } from "@/hooks/use-action-error";
import { calculateSavingsPercentage } from "@/components/Pricing/pricing-plans";
import { createPlanSelectionSchema } from "../schemas";
import { createCheckoutSession } from "@/actions/payment";
import { createOrganization, saveOnboardingFormData } from "@/actions/onboarding";
import { clearOnboardingDraft } from "../../_lib/onboarding-draft";
import type { z } from "zod";
import type {
    BillingPeriod,
    OnboardingFormData,
    OnboardingPlan,
    UpdateFormData,
} from "../../_lib/onboarding-types";

/** Step 3's own slice of the wizard's form data. */
export type PlanSelectionFormValues = z.infer<
    ReturnType<typeof createPlanSelectionSchema>
>;

export function usePlanSelection({
    plans,
    formData,
    updateFormData,
    userId,
}: {
    plans: OnboardingPlan[];
    formData: OnboardingFormData;
    updateFormData: UpdateFormData;
    userId: string;
}) {
    const router = useRouter();
    const t = useTranslations("onboarding.planSelection.toasts");
    const tValidation = useTranslations("onboarding.orgDetails.validation");
    const actionError = useActionError();

    // Built inside the hook because its message is translated; see ../schemas.
    const planSelectionSchema = useMemo(
        () => createPlanSelectionSchema(tValidation),
        [tValidation]
    );

    const {
        setValue,
        watch,
        handleSubmit,
        formState: { errors },
    } = useForm<PlanSelectionFormValues>({
        resolver: zodResolver(planSelectionSchema),
        mode: "onChange",
        defaultValues: {
            planId: formData.planId || "",
        },
    });

    const selectedPlanId = watch("planId");
    const [loading, setLoading] = useState(false);
    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

    // Same maths as the public pricing section, which is the point: the two
    // surfaces quote the same discount because they share one function.
    const savingsPercentage = calculateSavingsPercentage(plans);

    const handleSelectPlan = (planId: string) => {
        setValue("planId", planId, { shouldValidate: true });
    };

    const handleCreateOrg = async () => {
        setLoading(true);
        try {
            // No billingPeriod: this is the free-plan path, there is no
            // subscription to bill, and OrganizationInput has never carried the
            // field — it was being silently dropped by the action's validation.
            const result = await createOrganization({
                ...formData,
                planId: selectedPlanId,
                userId,
            });

            if (result.success) {
                // The dealership exists now, so the saved answers are spent.
                // Left behind, they would refill the wizard for whoever opens
                // this tab next.
                clearOnboardingDraft();
                updateFormData({ planId: selectedPlanId, billingPeriod });
                // Redirect to dashboard with onboarding complete flag
                router.push(`/org/${result.data.organization.slug}/dashboard?onboarding=complete`);
            } else {
                toast.error(actionError(result.error, t("createFailed")));
            }
        } catch (error) {
            console.error("Error creating organization:", error);
            toast.error(t("createFailed"));
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: PlanSelectionFormValues) => {
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
                    toast.error(actionError(sessionRes.error, t("saveFailed")));
                    setLoading(false);
                    return;
                }

                // 2. Create Stripe Checkout Session
                const res = await createCheckoutSession(
                    plan.id,
                    billingPeriod,
                    sessionRes.data.sessionId,
                );

                if (res.success && res.data.url) {
                    // 3. Redirect to Stripe Checkout
                    window.location.href = res.data.url;
                } else if (res.success) {
                    // Stripe can return a session without a url; assigning null
                    // to location.href navigates to "/null" instead of failing.
                    toast.error(t("checkoutFailed"));
                    setLoading(false);
                } else {
                    toast.error(actionError(res.error, t("paymentFailed")));
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error initiating checkout:", error);
                toast.error(t("checkoutFailed"));
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
