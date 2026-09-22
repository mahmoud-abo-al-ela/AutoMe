"use client";

import { PlanCard } from "./PlanCard";
import { PLAN_CONFIG } from "./constants";
import type {
    BillingPeriod,
    OnboardingPlan,
} from "../../_lib/onboarding-types";

export function PlanGrid({
    plans,
    selectedPlanId,
    onSelectPlan,
    billingPeriod,
}: {
    plans: OnboardingPlan[];
    selectedPlanId: string;
    onSelectPlan: (planId: string) => void;
    billingPeriod: BillingPeriod;
}) {
    return (
        <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, index) => {
                const config = PLAN_CONFIG[plan.type] || PLAN_CONFIG.STARTER;
                const isSelected = selectedPlanId === plan.id;

                return (
                    <PlanCard
                        key={plan.id}
                        plan={plan}
                        config={config}
                        isSelected={isSelected}
                        onSelect={onSelectPlan}
                        index={index}
                        billingPeriod={billingPeriod}
                    />
                );
            })}
        </div>
    );
}
