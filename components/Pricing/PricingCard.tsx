"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import {
  formatPlanPrice,
  formatPlanPeriod,
  type UiPlan,
} from "./pricing-plans";

// A single pricing plan card.
export default function PricingCard({
  plan,
  billingPeriod,
  index,
}: {
  plan: UiPlan;
  billingPeriod: string;
  index: number;
}) {
  const Icon = plan.icon;

  return (
    <motion.div
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
            {formatPlanPrice(plan, billingPeriod)}
          </span>
          <span
            className={`text-sm ${plan.popular ? "text-blue-100" : "text-muted-foreground"
              }`}
          >
            /{formatPlanPeriod(plan, billingPeriod)}
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
            href={`/sign-up?redirect_url=${encodeURIComponent(plan.ctaLink)}`}
            className="flex items-center justify-center gap-2"
          >
            {plan.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </SignedOut>
    </motion.div>
  );
}
