"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowUpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpgradeBanner({ resource, current, limit, planType, orgSlug }) {
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

  if (dismissed || limit === -1) return null;

  const isAtLimit = current >= limit;
  const isNearLimit = current >= limit * 0.8 && !isAtLimit;

  if (!isAtLimit && !isNearLimit) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(`upgrade-banner-${resource}-dismissed`, "true");
    setDismissed(true);
  };

  const resourceLabels = {
    cars: "cars",
    members: "team members",
    aiProcessing: "AI processing requests",
  };

  const label = resourceLabels[resource] || "items";

  return (
    <div
      className={`relative w-full p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 ${
        isAtLimit
          ? "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400"
          : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
      }`}
    >
      <div className="flex items-center gap-3">
        {isAtLimit ? (
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
        ) : (
          <ArrowUpCircle className="w-5 h-5 flex-shrink-0" />
        )}
        <div>
          <p className="font-medium text-sm">
            {isAtLimit
              ? `You've reached your ${label} limit on the ${planType} plan.`
              : `You've used ${current} of ${limit} ${label} on the ${planType} plan.`}
          </p>
          <p className="text-xs opacity-90 mt-0.5">
            Upgrade your plan to unlock higher limits and premium features.
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 shrink-0">
        <Button asChild size="sm" variant={isAtLimit ? "destructive" : "default"} className={!isAtLimit ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}>
          <Link href={`/org/${orgSlug}/billing`}>
            Upgrade Plan
          </Link>
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
