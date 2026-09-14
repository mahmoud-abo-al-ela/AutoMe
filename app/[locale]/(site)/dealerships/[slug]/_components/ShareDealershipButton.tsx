"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import ShareDialog from "@/app/[locale]/(site)/cars/[id]/_components/ShareDialog";
import type { DealershipDetail } from "../_lib/detail-types";

export const ShareDealershipButton = ({
    dealership,
    variant = "outline",
    size = "icon",
    className = "",
}: {
    dealership: DealershipDetail;
    variant?: React.ComponentProps<typeof Button>["variant"];
    size?: React.ComponentProps<typeof Button>["size"];
    className?: string;
}) => {
    const t = useTranslations("dealerships.header");
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={variant}
                        size={size}
                        onClick={() => setIsShareDialogOpen(true)}
                        className={`cursor-pointer ${className}`}
                        aria-label={t("shareDealership")}
                    >
                        <Share2 className="h-4 w-4" />
                        {size !== "icon" && <span className="hidden sm:inline">{t("share")}</span>}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t("shareDealership")}</p>
                </TooltipContent>
            </Tooltip>

            <ShareDialog
                isOpen={isShareDialogOpen}
                onOpenChange={setIsShareDialogOpen}
                title={t("shareDialogTitle")}
            />
        </>
    );
};
