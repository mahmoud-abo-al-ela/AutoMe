import { Sparkles, TrendingUp, Crown, type LucideIcon } from "lucide-react";

/**
 * The per-tier styling a PlanCard reads. Colours and icon only — the badge is a
 * message key under `plans`, and the plan's own name and description come from
 * there too, keyed on its `type`.
 */
export interface PlanConfig {
    icon: LucideIcon;
    color: string;
    border: string;
    bg: string;
    badgeKey: "mostPopular" | null;
}

export const PLAN_CONFIG: Record<string, PlanConfig> = {
    STARTER: {
        icon: Sparkles,
        color: "text-gray-600",
        border: "border-gray-200",
        bg: "from-gray-50 to-slate-50",
        badgeKey: null,
    },
    PRO: {
        icon: TrendingUp,
        color: "text-blue-600",
        border: "border-blue-500",
        bg: "from-blue-50 to-indigo-50",
        badgeKey: "mostPopular",
    },
    ENTERPRISE: {
        icon: Crown,
        color: "text-purple-600",
        border: "border-purple-500",
        bg: "from-purple-50 to-pink-50",
        badgeKey: null,
    },
};
