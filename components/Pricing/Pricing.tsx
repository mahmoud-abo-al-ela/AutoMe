"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BillingToggle } from "./BillingToggle";
import { resolvePlans, calculateSavingsPercentage, type DbPlan } from "./pricing-plans";
import PricingCard from "./PricingCard";

/**
 * Dealership plans, on /for-dealers. `#plans` is the anchor the page's own
 * "See plans" jumps to.
 */
const Pricing = ({ plans: dbPlans }: { plans?: DbPlan[] | null }) => {
  const t = useTranslations("home.pricing");
  const [billingPeriod, setBillingPeriod] = useState("monthly");

  const plans = resolvePlans(dbPlans);
  const savingsPercentage = calculateSavingsPercentage(plans);

  return (
    <section id="plans" aria-labelledby="plans-title" className="scroll-mt-24">
      <div className="mb-10 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h2 id="plans-title" className="text-h1 font-extrabold">
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
    </section>
  );
};

export default Pricing;
