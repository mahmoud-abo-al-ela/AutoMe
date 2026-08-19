"use client";

import { useState } from "react";
import { formatCarPrice } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "@/i18n/navigation";
import { StartConversationButton, ChatSidebar } from "@/components/StreamChat";
import type { CarDetail, PriceFormatter } from "../_lib/car-detail-types";

const MobileStickyBar = ({
    car,
    formatPrice,
}: {
    car: CarDetail;
    formatPrice?: PriceFormatter;
}) => {
    const { isSignedIn } = useUser();
    const router = useRouter();
    const [chatOpen, setChatOpen] = useState(false);
    const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

    const handleChatClick = () => {
        if (!isSignedIn) {
            router.push(`/messages?carId=${car.id}`);
            return;
        }
    };

    const handleChatOpen = (carId: string) => {
        setSelectedCarId(carId);
        setChatOpen(true);
    };

    const priceFormatted = formatPrice
        ? formatPrice(car.price)
        : formatCarPrice(car.price, "en", car.priceCurrency);

    return (
        <>
            <div className="fixed bottom-0 start-0 end-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-3 px-4 py-3 max-w-7xl mx-auto">
                    {/* Price */}
                    <div className="flex-1 min-w-0">
                        <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                            {priceFormatted}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                            {car.title || `${car.year} ${car.make} ${car.model}`}
                        </div>
                    </div>

                    {/* Chat CTA */}
                    {isSignedIn ? (
                        <StartConversationButton
                            carId={car.id}
                            onChatOpen={handleChatOpen}
                            className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 py-2.5 text-sm font-semibold rounded-xl shadow-md"
                        />
                    ) : (
                        <Button
                            onClick={handleChatClick}
                            className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 py-2.5 text-sm font-semibold rounded-xl shadow-md"
                        >
                            <MessageCircle className="w-4 h-4 me-1.5" />
                            Chat Now
                        </Button>
                    )}
                </div>
            </div>

            {isSignedIn && (
                <ChatSidebar
                    open={chatOpen}
                    onOpenChange={setChatOpen}
                    carId={selectedCarId}
                />
            )}

            {/* Spacer to prevent content from being hidden behind the sticky bar */}
            <div className="h-16 lg:hidden" />
        </>
    );
};

export default MobileStickyBar;
