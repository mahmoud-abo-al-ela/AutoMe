"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
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
                        aria-label="Share dealership"
                    >
                        <Share2 className="h-4 w-4" />
                        {size !== "icon" && <span className="hidden sm:inline">Share</span>}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Share dealership</p>
                </TooltipContent>
            </Tooltip>

            <ShareDialog
                isOpen={isShareDialogOpen}
                onOpenChange={setIsShareDialogOpen}
                title="Share This Dealership"
            />
        </>
    );
};
