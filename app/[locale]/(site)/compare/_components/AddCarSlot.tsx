"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

/**
 * Dashed-border placeholder card shown in empty compare slots.
 *
 * Features:
 *  - Dashed border with subtle pulse animation to draw attention
 *  - Plus icon with "Add Car" text
 *  - Links to /cars browse page
 */
const AddCarSlot = (): React.ReactElement => {
    const t = useTranslations("compare");
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="relative rounded-lg border-2 border-dashed border-border bg-muted/50 overflow-hidden flex flex-col items-center justify-center min-h-[280px] print:hidden"
        >
            <motion.div
                animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.6, 1, 0.6],
                }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="flex flex-col items-center gap-3"
            >
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">{t("slot.addCar")}</p>
            </motion.div>

            <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-4 text-xs cursor-pointer"
            >
                <Link href="/cars">{t("slot.browseCars")}</Link>
            </Button>
        </motion.div>
    );
};

export default AddCarSlot;
