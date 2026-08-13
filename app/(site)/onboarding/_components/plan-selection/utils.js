import { Car, Shield, Star, Zap } from "lucide-react";

export const formatPrice = (price) => {
    if (price === 0) return "Free";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
    }).format(price / 100);
};

export const getFeatures = (plan) => {
    const f = plan.features || {};
    const features = [];

    features.push({
        name:
            plan.maxCars === -1
                ? "Unlimited car listings"
                : `${plan.maxCars} car listings`,
        included: true,
        icon: Car,
    });
    features.push({
        name:
            plan.maxMembers === -1
                ? "Unlimited team members"
                : `${plan.maxMembers} team members`,
        included: true,
        icon: Shield,
    });
    features.push({
        name: `${plan.maxImagesPerCar} images per car`,
        included: true,
        icon: Star,
    });
    features.push({
        name:
            plan.auditLogRetentionDays === null
                ? "Unlimited audit logs"
                : `${plan.auditLogRetentionDays} days audit logs`,
        included: true,
        icon: Zap,
    });

    Object.entries(f).forEach(([key, value]) => {
        if (
            key === "analytics" ||
            key === "whiteLabel" ||
            key === "webhooks" ||
            key === "description" ||
            key === "featureList" ||
            key === "color" ||
            key === "badge"
        )
            return;
        if (typeof value === "object" && value !== null && "enabled" in value) {
            features.push({
                name: formatFeatureName(key),
                included: !!value.enabled,
            });
        } else if (typeof value === "boolean") {
            features.push({ name: formatFeatureName(key), included: value });
        }
    });

    return features;
};

export const formatFeatureName = (key) => {
    const nameMap = {
        aiProcessing: "AI Processing",
        chat: "Live Chat",
        prioritySupport: "Priority Support",
    };
    return (
        nameMap[key] ||
        key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())
            .trim()
    );
};
