"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Zap, Shield, Headphones, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { BillingToggle } from "./BillingToggle";

const Pricing = ({ plans: dbPlans }) => {
  const [billingPeriod, setBillingPeriod] = useState("monthly");

  const defaultPlans = [
    {
      name: "Starter",
      description: "Perfect for small dealerships",
      monthlyPrice: 0,
      yearlyPrice: 0,
      popular: false,
      features: [
        { name: "5 car listings", included: true },
        { name: "3 team members", included: true },
        { name: "5 images per car", included: true },
        { name: "30 days audit logs", included: true },
        { name: "Live Chat", included: false },
        { name: "AI Processing", included: false },
        { name: "Priority Support", included: false },
      ],
      cta: "Get Started",
      ctaLink: "/onboarding",
      icon: Zap,
      type: "STARTER",
    },
    {
      name: "Professional",
      description: "For growing dealerships",
      monthlyPrice: 4900,
      yearlyPrice: 47040,
      popular: true,
      features: [
        { name: "50 car listings", included: true },
        { name: "10 team members", included: true },
        { name: "10 images per car", included: true },
        { name: "90 days audit logs", included: true },
        { name: "Live Chat", included: true },
        { name: "AI Processing", included: true },
        { name: "Priority Support", included: true },
      ],
      cta: "Get Started",
      ctaLink: "/onboarding",
      icon: Shield,
      type: "PRO",
    },
    {
      name: "Enterprise",
      description: "For large dealership groups",
      monthlyPrice: null,
      yearlyPrice: null,
      popular: false,
      features: [
        { name: "Unlimited car listings", included: true },
        { name: "Unlimited team members", included: true },
        { name: "20 images per car", included: true },
        { name: "Unlimited audit logs", included: true },
        { name: "Live Chat", included: true },
        { name: "AI Processing", included: true },
        { name: "Priority Support", included: true },
      ],
      cta: "Get Started",
      ctaLink: "/onboarding",
      icon: Headphones,
      type: "ENTERPRISE",
    },
  ];

  const mapDbPlanToUi = (plan) => {
    const isPro = plan.type === "PRO";
    const isEnterprise = plan.type === "ENTERPRISE";

    let icon = Zap;
    if (isPro) icon = Shield;
    if (isEnterprise) icon = Headphones;

    let description = "Perfect for small dealerships";
    if (isPro) description = "For growing dealerships";
    if (isEnterprise) description = "For large dealership groups";

    let cta = "Get Started";
    let ctaLink = "/onboarding";

    // Handle features JSON
    const f = plan.features || {};

    const features = [
      {
        name:
          plan.maxCars === -1
            ? "Unlimited car listings"
            : `${plan.maxCars} car listings`,
        included: true,
      },
      {
        name:
          plan.maxMembers === -1
            ? "Unlimited team members"
            : `${plan.maxMembers} team members`,
        included: true,
      },
      {
        name: `${plan.maxImagesPerCar || 5} images per car`,
        included: true,
      },
      {
        name: plan.auditLogRetentionDays
          ? `${plan.auditLogRetentionDays} days audit logs`
          : "Unlimited audit logs",
        included: true,
      },
      { name: "Live Chat", included: !!f.chat },
      { name: "AI Processing", included: !!f.aiProcessing?.enabled },
      { name: "Priority Support", included: !!f.prioritySupport },
    ];

    return {
      ...plan,
      description,
      popular: isPro,
      features,
      cta,
      ctaLink,
      icon,
    };
  };

  const plans =
    dbPlans && dbPlans.length > 0 ? dbPlans.map(mapDbPlanToUi) : defaultPlans;

  // Calculate average savings percentage from paid plans
  const calculateSavingsPercentage = () => {
    const paidPlans = plans.filter(
      (plan) => plan.monthlyPrice > 0 && plan.monthlyPrice !== null,
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

  const formatPrice = (plan) => {
    if (plan.monthlyPrice === null) return "Custom";
    const price =
      billingPeriod === "monthly"
        ? plan.monthlyPrice
        : plan.yearlyPrice || plan.monthlyPrice * 12 * 0.8;
    return `$${Math.floor(price / 100)}`;
  };

  const formatPeriod = (plan) => {
    if (plan.monthlyPrice === null) return "";
    if (plan.monthlyPrice === 0) return "forever";
    return billingPeriod === "monthly" ? "per month" : "per year";
  };

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
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative rounded-2xl p-6 sm:p-8 ${plan.popular
                    ? "bg-primary text-primary-foreground shadow-2xl scale-105"
                    : "bg-card border border-border shadow-lg hover:shadow-xl"
                  } transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${plan.popular
                        ? "bg-white/20"
                        : "bg-primary/10"
                      }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${plan.popular ? "text-white" : "text-primary"
                        }`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`text-xl font-bold ${plan.popular ? "text-white" : "text-foreground"
                        }`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`text-sm ${plan.popular ? "text-blue-100" : "text-muted-foreground"
                        }`}
                    >
                      {plan.description}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl sm:text-5xl font-bold ${plan.popular ? "text-white" : "text-foreground"
                        }`}
                    >
                      {formatPrice(plan)}
                    </span>
                    <span
                      className={`text-sm ${plan.popular ? "text-blue-100" : "text-muted-foreground"
                        }`}
                    >
                      /{formatPeriod(plan)}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-3 ${!feature.included ? "opacity-60" : ""
                        }`}
                    >
                      {feature.included ? (
                        <Check
                          className={`h-5 w-5 flex-shrink-0 mt-0.5 ${plan.popular ? "text-green-300" : "text-green-600"
                            }`}
                        />
                      ) : (
                        <X
                          className={`h-5 w-5 flex-shrink-0 mt-0.5 ${plan.popular ? "text-red-300" : "text-muted-foreground"
                            }`}
                        />
                      )}
                      <span
                        className={`text-sm ${plan.popular ? "text-white" : "text-foreground"
                          } ${!feature.included && !plan.popular
                            ? "line-through text-muted-foreground"
                            : ""
                          }`}
                      >
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <SignedIn>
                  <Button
                    asChild
                    className={`w-full ${plan.popular
                        ? "bg-white text-primary hover:bg-white/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    size="lg"
                  >
                    <Link
                      href={plan.ctaLink}
                      className="flex items-center justify-center gap-2"
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </SignedIn>
                <SignedOut>
                  <Button
                    asChild
                    className={`w-full ${plan.popular
                        ? "bg-white text-primary hover:bg-white/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    size="lg"
                  >
                    <Link
                      href={`/sign-up?redirect_url=${encodeURIComponent(
                        plan.ctaLink,
                      )}`}
                      className="flex items-center justify-center gap-2"
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </SignedOut>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
