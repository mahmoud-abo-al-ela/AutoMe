"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";
import { createConversation } from "@/actions/messages";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function MessageDealerButton({ organizationId, carId, className }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleClick = async () => {
        setLoading(true);

        const result = await createConversation(organizationId, carId);

        if (result.success) {
            toast.success("Conversation started");
            router.push("/messages");
        } else {
            toast.error(result.error || "Failed to start conversation");
        }

        setLoading(false);
    };

    return (
        <Button
            onClick={handleClick}
            disabled={loading}
            variant="outline"
            className={className}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
            )}
            Message Dealer
        </Button>
    );
}
