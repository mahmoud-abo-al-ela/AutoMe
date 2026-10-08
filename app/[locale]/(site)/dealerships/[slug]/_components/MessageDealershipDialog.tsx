"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { ChevronRight, MessageSquare } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { carChatReturnPath, useChatDock } from "@/components/StreamChat";
import { useAuthRedirects } from "@/hooks/use-auth-redirects";
import { useFormatters } from "@/hooks/use-formatters";
import { resolveCarTitle } from "@/lib/utils/car-text";
import type { Locale } from "@/i18n/routing";
import type { DealershipCar, DealershipDetail } from "../_lib/detail-types";

/**
 * "Message the dealership" asks which car first. Conversations on AutoMe are
 * about a car — the dealer's inbox and sales desk are built around one — so
 * rather than a car-less chat the dealer would have to untangle, the buyer
 * picks the car and that car's chat opens (signed out: sign in, then back to
 * the car with its chat open, as from the car page).
 */
export function MessageDealershipDialog({
    dealership,
    newestCars,
    onShowAllCars,
}: {
    dealership: DealershipDetail;
    newestCars: DealershipCar[];
    onShowAllCars: () => void;
}) {
    const t = useTranslations("dealerships.detail");
    const locale = useLocale() as Locale;
    const fmt = useFormatters();
    const { isSignedIn } = useAuth();
    const { openCarChat } = useChatDock();
    const { signInTo } = useAuthRedirects();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const pick = (carId: string) => {
        setOpen(false);
        if (isSignedIn) openCarChat(carId);
        else router.push(signInTo(carChatReturnPath(carId)));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="marker" size="xl" className="w-full">
                    <MessageSquare />
                    {t("visit.message")}
                </Button>
            </DialogTrigger>
            <DialogContent className="gap-4 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("messageDialog.title")}</DialogTitle>
                    <DialogDescription>{t("messageDialog.body", { name: dealership.name })}</DialogDescription>
                </DialogHeader>

                <ul className="-mx-2 flex max-h-[50vh] flex-col overflow-y-auto">
                    {newestCars.map((car) => {
                        const title =
                            resolveCarTitle(car, locale)?.text ??
                            `${fmt.number(car.year, { useGrouping: false })} ${car.make} ${car.model}`;
                        return (
                            <li key={car.id}>
                                <button
                                    type="button"
                                    onClick={() => pick(car.id)}
                                    className="flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-control px-2 py-2 text-start transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                                >
                                    <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-plate bg-muted">
                                        {car.images[0] && (
                                            <Image src={car.images[0]} alt="" fill sizes="64px" className="object-cover" />
                                        )}
                                    </span>
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <span dir="auto" className="truncate text-caption font-semibold">
                                            {title}
                                        </span>
                                        <span className="text-micro text-muted-foreground">{fmt.price(car.price)}</span>
                                    </span>
                                    <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
                                </button>
                            </li>
                        );
                    })}
                </ul>

                {dealership.carCount > newestCars.length && (
                    <Button
                        variant="outline-strong"
                        size="control"
                        onClick={() => {
                            setOpen(false);
                            onShowAllCars();
                        }}
                    >
                        {t("messageDialog.seeAll", {
                            count: dealership.carCount,
                            value: fmt.number(dealership.carCount),
                        })}
                    </Button>
                )}
            </DialogContent>
        </Dialog>
    );
}
