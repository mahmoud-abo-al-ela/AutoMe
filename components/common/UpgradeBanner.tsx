"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AlertCircle, ArrowUpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import { upgradeBannerState } from "@/lib/utils/plan-banner";

type UpgradeResource = "cars" | "members" | "aiProcessing";

type UpgradeBannerProps = {
  resource: UpgradeResource;
  current: number;
  /** -1 means unlimited, in which case the banner never renders. */
  limit: number;
  planType: string;
  orgSlug: string;
};

export function UpgradeBanner({
  resource,
  current,
  limit,
  planType,
  orgSlug,
}: UpgradeBannerProps) {
  const t = useTranslations("org.upgradeBanner");
  const { number } = useFormatters();
  const [dismissed, setDismissed] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        return !!sessionStorage.getItem(`upgrade-banner-${resource}-dismissed`);
      }
      return false;
    } catch {
      return false;
    }
  });

  const state = upgradeBannerState({ current, limit, planType });

  if (dismissed || state === "hidden") return null;

  const handleDismiss = () => {
    sessionStorage.setItem(`upgrade-banner-${resource}-dismissed`, "true");
    setDismissed(true);
  };

  // Numbers are formatted before they enter the message: next-intl formats a
  // raw numeric argument against the bare `ar` tag, which gives Western digits
  // while the rest of the Arabic UI is in Eastern ones. See
  // lib/utils/intl-locale.
  const params = {
    resource: t(`resources.${resource}`),
    plan: planType,
    current: number(current),
    limit: number(limit),
  };

  const headline = {
    noPlan: () => t("noPlan"),
    notIncluded: () => t("notIncluded", params),
    atLimit: () => t("atLimit", params),
    nearLimit: () => t("nearLimit", params),
  }[state]();

  const body = {
    noPlan: () => t("noPlanBody", params),
    notIncluded: () => t("notIncludedBody"),
    atLimit: () => t("body"),
    nearLimit: () => t("body"),
  }[state]();

  // Only a genuinely exhausted quota is an error. A feature the plan does not
  // carry is an upsell, and reads as one — in amber, not alarm red.
  const isError = state === "atLimit";

  return (
    <div
      className={`relative w-full p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 ${
        isError
          ? "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400"
          : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
      }`}
    >
      <div className="flex items-center gap-3">
        {isError ? (
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
        ) : (
          <ArrowUpCircle className="w-5 h-5 flex-shrink-0" />
        )}
        <div>
          <p className="font-medium text-sm">{headline}</p>
          <p className="text-xs opacity-90 mt-0.5">{body}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Button
          asChild
          size="sm"
          variant={isError ? "destructive" : "default"}
          className={!isError ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
        >
          <Link href={`/org/${orgSlug}/billing`}>{t("cta")}</Link>
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label={t("dismiss")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
