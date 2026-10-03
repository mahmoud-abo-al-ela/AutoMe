"use client";
import { useTranslations } from "next-intl";
import { ArrowRight, Check, X } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatPlanPrice, planPeriodKey, type UiPlan } from "./pricing-plans";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";

/**
 * A single pricing plan card. The popular plan is the asphalt card with the
 * marker CTA — the one primary action in the row; the others are outlined.
 * Plan prices are plain figures, never the price plate: that shape means a
 * car's price and nothing else.
 */
export default function PricingCard({
  plan,
  billingPeriod,
}: {
  plan: UiPlan;
  billingPeriod: string;
}) {
  const t = useTranslations("home.pricing");
  // Plan names, bullets and billing copy are shared with the onboarding
  // wizard, so they live in their own namespace rather than under the home
  // page that happened to render them first.
  const tPlans = useTranslations("plans");
  const fmt = useFormatters();
  const { isSignedIn } = useAuth();
  // Feature bullets interpolate a plan limit. The number is formatted here
  // rather than left to ICU, which would use the bare `ar` tag and render
  // Western digits against the Eastern ones everywhere else on the card.
  const featureParams = (feature: UiPlan["features"][number]) =>
    feature.params ? { value: fmt.number(feature.params.count) } : undefined;
  const Icon = plan.icon;
  const price = formatPlanPrice(plan, billingPeriod, fmt.locale);
  const periodKey = planPeriodKey(plan, billingPeriod);
  // A DB plan with an unrecognised `type` has no message key, so it falls back
  // to the untranslated DB name rather than rendering blank.
  const name = plan.planKey ? tPlans(`plans.${plan.planKey}.name`) : plan.name;
  const description = plan.planKey ? tPlans(`plans.${plan.planKey}.description`) : null;
  const popular = !!plan.popular;
  const href = isSignedIn ? plan.ctaLink : `/sign-up?redirect_url=${encodeURIComponent(plan.ctaLink)}`;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-control p-6 sm:p-8",
        popular ? "bg-inverse text-inverse-foreground" : "border border-border bg-card"
      )}
    >
      {popular && (
        <span className="absolute -top-3 start-6 rounded-plate border-2 border-border-strong bg-marker px-2.5 py-0.5 text-micro font-bold text-marker-foreground">
          {tPlans("mostPopular")}
        </span>
      )}

      <div className="mb-5 flex items-center gap-3">
        <span
          aria-hidden
          className={cn(
            "flex size-11 items-center justify-center rounded-control",
            popular ? "bg-inverse-foreground/10" : "bg-muted"
          )}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <h3 className="text-h3 font-semibold">{name}</h3>
          {description && (
            <p className={cn("text-micro", popular ? "text-inverse-foreground/70" : "text-muted-foreground")}>{description}</p>
          )}
        </div>
      </div>

      <p className="mb-6 flex items-baseline gap-1.5">
        <span className="text-[2.5rem] leading-none font-black">{price ?? tPlans("custom")}</span>
        {periodKey && (
          <span className={cn("text-caption", popular ? "text-inverse-foreground/70" : "text-muted-foreground")}>
            /{tPlans(periodKey)}
          </span>
        )}
      </p>

      <ul className="mb-8 flex flex-1 flex-col gap-3">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5">
            {feature.included ? (
              <Check aria-hidden className={cn("mt-0.5 size-[18px] shrink-0", popular ? "text-marker" : "text-positive")} />
            ) : (
              <X aria-hidden className={cn("mt-0.5 size-[18px] shrink-0", popular ? "text-inverse-foreground/50" : "text-muted-foreground")} />
            )}
            <span
              className={cn(
                "text-caption",
                !feature.included && (popular ? "text-inverse-foreground/60" : "text-muted-foreground")
              )}
            >
              {/* The icon is decorative; screen readers get the state in words. */}
              {!feature.included && <span className="sr-only">{tPlans("notIncluded")}: </span>}
              {tPlans(`features.${feature.key}`, featureParams(feature))}
            </span>
          </li>
        ))}
      </ul>

      <Button asChild size="xl" variant={popular ? "marker" : "outline-strong"} className="w-full">
        <Link href={href}>
          {t("cta")}
          <ArrowRight className="rtl:rotate-180" />
        </Link>
      </Button>
    </div>
  );
}
