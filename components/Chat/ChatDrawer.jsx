"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// Placeholder for existing chat drawer functionality
// This maintains compatibility with existing code
export function ChatDrawer({ open, onOpenChange, carId, car, currentUserId, currentUserName }) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Chat</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                        Chat functionality - this can be integrated with the messaging system
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}
