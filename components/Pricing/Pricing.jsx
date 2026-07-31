"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { BillingToggle } from "./BillingToggle";
import { resolvePlans, calculateSavingsPercentage } from "./pricing-plans";
import PricingCard from "./PricingCard";

const Pricing = ({ plans: dbPlans }) => {
  const [billingPeriod, setBillingPeriod] = useState("monthly");

  const plans = resolvePlans(dbPlans);
  const savingsPercentage = calculateSavingsPercentage(plans);

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Shield className="h-4 w-4" />
            <span>Pricing Plans</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-brand-accent">
              Pricing
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your dealership. No hidden fees, cancel
            anytime.
          </p>

          <BillingToggle
            billingPeriod={billingPeriod}
            onToggle={() =>
              setBillingPeriod((prev) =>
                prev === "monthly" ? "yearly" : "monthly",
              )
            }
            savingsPercentage={savingsPercentage}
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard
              key={index}
              plan={plan}
              billingPeriod={billingPeriod}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
