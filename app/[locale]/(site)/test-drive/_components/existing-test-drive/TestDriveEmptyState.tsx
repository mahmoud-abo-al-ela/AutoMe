"use client";

import { useRouter } from "@/i18n/navigation";
import { Info } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { useTranslations } from "next-intl";

const TestDriveEmptyState = () => {
    const t = useTranslations("testDrive.existing");
    const router = useRouter();

    return (
        <EmptyState
            variant="standalone"
            icon={Info}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            actionLabel={t("viewAll")}
            onAction={() => router.push("/test-drive")}
            secondaryActionLabel={t("browseCars")}
            onSecondaryAction={() => router.push("/cars")}
            className="border-0 bg-transparent shadow-none"
        />
    );
};

export default TestDriveEmptyState;