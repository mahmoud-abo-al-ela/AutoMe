"use client";

import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/common/EmptyState";

export default function EmptyTeamState() {
    const t = useTranslations("org.settings.team");

    return (
        <EmptyState 
            variant="inline" 
            icon={Users} 
            title={t("emptyTitle")}
            description={t("emptyBody")}
        />
    );
}
