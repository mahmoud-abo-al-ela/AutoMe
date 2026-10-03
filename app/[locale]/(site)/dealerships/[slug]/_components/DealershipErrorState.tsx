"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export const DealershipErrorState = ({ error }: { error?: string | null }) => {
    const t = useTranslations("dealerships.errors");

    return (
        <div className="mx-auto w-full max-w-[1360px] px-4 py-8 sm:px-6 xl:px-0">
            <div className="bg-destructive-soft border border-destructive/30 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-destructive mb-2">
                    {t("detailTitle")}
                </h3>
                <p className="text-destructive mb-4">{error || t("detailBody")}</p>
                <Link href="/dealerships">
                    <Button>{t("backToList")}</Button>
                </Link>
            </div>
        </div>
    );
};
