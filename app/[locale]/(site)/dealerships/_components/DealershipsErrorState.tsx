"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export const DealershipsErrorState = ({
    error,
    onRetry,
}: {
    error?: string;
    onRetry?: () => void;
}) => {
    const t = useTranslations("dealerships.errors");
    const tCommon = useTranslations("common");

    const handleRetry = () => {
        if (onRetry) {
            onRetry();
        } else if (typeof window !== "undefined") {
            window.location.reload();
        }
    };

    return (
        <div
            role="alert"
            className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center"
        >
            <h3 className="mb-2 text-lg font-semibold text-destructive">
                {t("listTitle")}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
                {error || t("listBody")}
            </p>
            <Button onClick={handleRetry} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                {tCommon("actions.retry")}
            </Button>
        </div>
    );
};

export default DealershipsErrorState;
