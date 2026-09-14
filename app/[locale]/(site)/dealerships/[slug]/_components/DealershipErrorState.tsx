"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export const DealershipErrorState = ({ error }: { error?: string | null }) => {
    const t = useTranslations("dealerships.errors");

    return (
        <div className="container mx-auto py-8 px-4 mt-18">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                    {t("detailTitle")}
                </h3>
                <p className="text-red-600 mb-4">{error || t("detailBody")}</p>
                <Link href="/dealerships">
                    <Button>{t("backToList")}</Button>
                </Link>
            </div>
        </div>
    );
};
