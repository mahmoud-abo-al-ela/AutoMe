// Status/plan display config + pure helpers for the CurrentPlan components.
import {
  AlertTriangle,
  XCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SubscriptionStatus } from "@/lib/generated/prisma";

// Partial: SubscriptionStatus has values beyond these four (INCOMPLETE, UNPAID
// and so on), and the consumers already treat a miss as "no badge".
export const STATUS_CONFIG: Partial<
  Record<
    SubscriptionStatus,
    {
      badge: string;
      badgeLabel: string;
      cardBorder: string;
      icon: LucideIcon;
      iconColor: string;
    }
  >
> = {
  ACTIVE: {
    badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    badgeLabel: "Active",
    cardBorder: "border-green-200 dark:border-green-800",
    icon: CheckCircle2,
    iconColor: "text-green-600",
  },
  TRIALING: {
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    badgeLabel: "Trial",
    cardBorder: "border-amber-200 dark:border-amber-800",
    icon: Clock,
    iconColor: "text-amber-600",
  },
  PAST_DUE: {
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    badgeLabel: "Past Due",
    cardBorder: "border-red-300 dark:border-red-800",
    icon: AlertTriangle,
    iconColor: "text-red-600",
  },
  CANCELED: {
    badge: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    badgeLabel: "Canceled",
    cardBorder: "border-gray-300 dark:border-gray-700",
    icon: XCircle,
    iconColor: "text-gray-500",
  },
};

export const PLAN_COLORS = {
  STARTER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  PRO: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ENTERPRISE:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export function getDaysRemaining(endDate: Date | string | null | undefined) {
  if (!endDate) return null;
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** limit === -1 means unlimited, which reads as 0% used. */
export function getUsagePercent(current: number, limit: number) {
  if (limit === -1) return 0;
  return Math.min((current / limit) * 100, 100);
}

/**
 * Get color class for usage progress bar based on percentage
 * Green < 60%, Yellow 60-80%, Red > 80%
 */
export function getUsageColor(percent: number) {
  if (percent > 80) return "bg-red-500";
  if (percent >= 60) return "bg-amber-500";
  return "bg-green-500";
}

/**
 * Get text color class for usage percentage label
 */
export function getUsageTextColor(percent: number) {
  if (percent > 80) return "text-red-600 dark:text-red-400";
  if (percent >= 60) return "text-amber-600 dark:text-amber-400";
  return "";
}
