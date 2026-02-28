import { Sparkles, TrendingUp, Crown } from "lucide-react";

export const PLAN_CONFIG = {
    STARTER: {
        icon: Sparkles,
        color: "text-gray-600",
        border: "border-gray-200",
        bg: "from-gray-50 to-slate-50",
        badge: null,
    },
    PRO: {
        icon: TrendingUp,
        color: "text-blue-600",
        border: "border-blue-500",
        bg: "from-blue-50 to-indigo-50",
        badge: "Most Popular",
    },
    ENTERPRISE: {
        icon: Crown,
        color: "text-purple-600",
        border: "border-purple-500",
        bg: "from-purple-50 to-pink-50",
        badge: null,
    },
};
