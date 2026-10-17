import { Sparkles, TrendingUp, Crown, type LucideIcon } from "lucide-react";

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
