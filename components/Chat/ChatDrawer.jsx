"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MessageCircle, X, Car, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChatWindow } from "./ChatWindow";
import { startConversation } from "@/actions/messages";
import { toast } from "sonner";

/**
 * Chat drawer that slides in from the right
 * Used on car detail pages - fullscreen on mobile for better UX
 */
export function ChatDrawer({
  open,
  onOpenChange,
  carId,
  car,
  currentUserId,
  currentUserName,
}) {
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Start or get conversation when drawer opens
  useEffect(() => {
    if (open && !conversation && !loading) {
      initConversation();
    }
  }, [open]);

  // Prevent body scroll on mobile when chat is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const initConversation = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await startConversation(carId);

      if (response.success) {
        setConversation(response.data);
      } else {
        setError(response.error?.message || "Failed to start conversation");
        toast.error(response.error?.message || "Failed to start conversation");
      }
    } catch (err) {
      setError("Failed to start conversation");
      toast.error("Failed to start conversation");
      console.error("Error starting conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  const carTitle =
    car?.title || (car ? `${car.make} ${car.model} ${car.year}` : "this car");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col h-[100dvh] sm:h-full"
      >
        {/* Mobile-optimized Header */}
        <SheetHeader className="p-3 sm:p-4 border-b bg-gradient-to-r from-blue-600/5 to-purple-600/5 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {car?.images?.[0] ? (
              <Image
                src={car.images[0].url}
                alt={carTitle}
                width={48}
                height={48}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Car className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-left text-sm sm:text-base truncate leading-tight">
                {carTitle}
              </SheetTitle>
            </div>
          </div>
        </SheetHeader>

        {/* Chat content - takes remaining height */}
        <div className="flex-1 overflow-hidden min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
              <p className="text-sm text-muted-foreground">Starting chat...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <X className="w-7 h-7 text-destructive" />
              </div>
              <p className="text-destructive font-medium mb-2">
                Connection failed
              </p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={initConversation} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          ) : conversation ? (
            <ChatWindow
              conversationId={conversation.id}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              className="h-full"
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Chat button that opens the drawer
 */
export function ChatButton({ onClick, className }) {
  return (
    <Button
      onClick={onClick}
      className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 ${
        className || ""
      }`}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Chat Now
    </Button>
  );
}
