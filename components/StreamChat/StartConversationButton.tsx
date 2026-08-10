"use client";

import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

type ButtonProps = React.ComponentProps<typeof Button>;

export function StartConversationButton({
    carId,
    variant = "default",
    size = "default",
    className,
    onChatOpen
}: {
    carId: string;
    variant?: ButtonProps["variant"];
    size?: ButtonProps["size"];
    className?: string;
    onChatOpen?: (carId: string) => void;
}) {
    const handleClick = () => {
        // Just open the chat sidebar, don't create channel yet
        if (onChatOpen) {
            onChatOpen(carId);
        }
    };

    return (
        <Button
            onClick={handleClick}
            variant={variant}
            size={size}
            className={className}
        >
            <MessageSquare className="h-4 w-4 mr-2" />
            Message Dealer
        </Button>
    );
}
