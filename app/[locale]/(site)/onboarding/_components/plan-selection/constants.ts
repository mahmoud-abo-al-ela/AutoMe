import { Sparkles, TrendingUp, Crown, type LucideIcon } from "lucide-react";

/**
 * The per-tier styling a PlanCard reads. Icon tile and border only — the badge
 * is a message key under `plans`, and the plan's own name and description come
 * from there too, keyed on its `type`. Site tokens, not tier colours: the
 * recommended plan is set apart by the marker tile and the strong border.
 */
export interface PlanConfig {
    icon: LucideIcon;
    tile: string;
    border: string;
    badgeKey: "mostPopular" | null;
}

export const PLAN_CONFIG: Record<string, PlanConfig> = {
    STARTER: {
        icon: Sparkles,
        tile: "bg-muted",
        border: "border-border",
        badgeKey: null,
    },
    PRO: {
        icon: TrendingUp,
        tile: "border-2 border-border-strong bg-marker",
        border: "border-2 border-border-strong",
        badgeKey: "mostPopular",
    },
    ENTERPRISE: {
        icon: Crown,
        tile: "bg-muted",
        border: "border-border",
        badgeKey: null,
    },
};
