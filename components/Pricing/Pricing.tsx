"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BillingToggle } from "./BillingToggle";
import { resolvePlans, calculateSavingsPercentage, type DbPlan } from "./pricing-plans";
import PricingCard from "./PricingCard";

/** Dealership plans, directly under the "For dealers" band on the home page. */
const Pricing = ({ plans: dbPlans }: { plans?: DbPlan[] | null }) => {
  const t = useTranslations("home.pricing");
  const [billingPeriod, setBillingPeriod] = useState("monthly");

  const plans = resolvePlans(dbPlans);
  const savingsPercentage = calculateSavingsPercentage(plans);

  return (
    <div id="pricing" className="scroll-mt-24 pt-12 sm:pt-16">
      <div className="mb-10 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-h1 font-extrabold">
            {t("title")} {t("titleAccent")}
          </h2>
          <p className="text-body text-muted-foreground">{t("subtitle")}</p>
        </div>
        <BillingToggle
          billingPeriod={billingPeriod}
          onToggle={() => setBillingPeriod((prev) => (prev === "monthly" ? "yearly" : "monthly"))}
          savingsPercentage={savingsPercentage}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan, index) => (
          <PricingCard key={index} plan={plan} billingPeriod={billingPeriod} />
        ))}
      </div>
    </div>
  );
};

export default Pricing;
