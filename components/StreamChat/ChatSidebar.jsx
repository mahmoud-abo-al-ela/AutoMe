"use client";

import { useEffect, useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Channel, MessageInput, MessageList, Window, useChatContext } from "stream-chat-react";
import { Loader2, Car, Send, MessageSquare, DollarSign, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { startCarConversation } from "@/actions/stream-chat";
import { toast } from "sonner";
import { getCarById } from "@/actions/cars-listing";

export function ChatSidebar({ open, onOpenChange, carId }) {
    const { client } = useChatContext();
    const [channel, setChannel] = useState(null);
    const [loading, setLoading] = useState(false);
    const [carInfo, setCarInfo] = useState(null);
    const [channelCreated, setChannelCreated] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [checkingChannel, setCheckingChannel] = useState(true); // New state to track channel check
    const inputRef = useRef(null);

    // Load car info and check for existing channel when sidebar opens
    useEffect(() => {
        if (!open || !carId || !client) {
            setChannel(null);
            setCarInfo(null);
            setChannelCreated(false);
            setMessageText("");
            setCheckingChannel(true);
            return;
        }

        const loadCarInfoAndChannel = async () => {
            try {
                setLoading(true);
                setCheckingChannel(true);

                // Fetch car info using server action
                const result = await getCarById(carId);
                if (result.success) {
                    setCarInfo(result.data);

                    // Check if a channel already exists for this car and user
                    // The channel ID format is deterministic: car-{carHash}-{userHash}
                    try {
                        const filters = {
                            type: 'messaging',
                            members: { $in: [client.userID] },
                            car_id: carId,
                        };

                        const sort = [{ last_message_at: -1 }];
                        const channels = await client.queryChannels(filters, sort, { limit: 1 });

                        if (channels.length > 0) {
                            // Existing channel found - load it
                            const existingChannel = channels[0];
                            await existingChannel.watch();
                            setChannel(existingChannel);
                            setChannelCreated(true);
                        } else {
                            // No existing channel - user will create one by sending first message
                            setChannel(null);
                            setChannelCreated(false);
                        }
                    } catch (channelError) {
                        console.error("Error checking for existing channel:", channelError);
                        // If there's an error checking, just proceed as if no channel exists
                        setChannel(null);
                        setChannelCreated(false);
                    }
                }
            } catch (error) {
                console.error("Error loading car info:", error);
                toast.error("Failed to load car information");
            } finally {
                setLoading(false);
                setCheckingChannel(false);
            }
        };

        loadCarInfoAndChannel();
    }, [open, carId, client]);

    // Handle sending the first message - this creates the channel
    const handleSubmit = async (e) => {
        e?.preventDefault();

        if (!messageText.trim() || loading) return;

        if (!channelCreated && carId) {
            try {
                setLoading(true);

                // Create the channel when first message is sent
                const result = await startCarConversation(carId);

                if (!result.success) {
                    toast.error(result.error || "Failed to start conversation");
                    return;
                }

                // Load the newly created channel
                const ch = client.channel(result.data.channelType, result.data.channelId);
                await ch.watch();
                setChannel(ch);
                setChannelCreated(true);

                // Send the message
                await ch.sendMessage({
                    text: messageText,
                });

                setMessageText("");
                toast.success("Message sent!");
            } catch (error) {
                console.error("Error creating channel:", error);
                toast.error("Failed to send message");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:w-[540px] p-0 flex flex-col"
                aria-label="Chat sidebar"
            >
                {/* Custom Header */}
                <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-background via-muted/10 to-background shrink-0">
                    {loading && !carInfo ? (
                        <div className="flex items-start gap-3">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                        </div>
                    ) : carInfo ? (
                        <div className="flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            {/* Avatar/Image */}
                            <Avatar className="h-12 w-12 rounded-lg ring-2 ring-primary/10">
                                {carInfo.images?.[0] ? (
                                    <AvatarImage
                                        src={carInfo.images[0].url}
                                        alt={carInfo.title}
                                        className="object-cover"
                                    />
                                ) : null}
                                <AvatarFallback className="rounded-lg bg-primary/10">
                                    <Car className="h-6 w-6 text-primary" />
                                </AvatarFallback>
                            </Avatar>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <SheetTitle className="text-base truncate flex items-center gap-2">
                                    {carInfo.title}
                                </SheetTitle>
                                <SheetDescription className="text-sm space-y-1">
                                    {carInfo.price && (
                                        <div className="flex items-center text-primary font-semibold">
                                            <DollarSign className="h-3 w-3" />
                                            {Number(carInfo.price).toLocaleString()}
                                        </div>
                                    )}
                                </SheetDescription>
                            </div>
                        </div>
                    ) : (
                        <SheetTitle>Chat</SheetTitle>
                    )}
                </SheetHeader>

                {/* Chat Area */}
                <div className="flex-1 overflow-hidden bg-background">
                    {checkingChannel || (loading && !carInfo) ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center space-y-4 animate-in fade-in duration-300">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                    <div className="absolute inset-0 w-16 h-16 rounded-full bg-primary/5 animate-ping mx-auto" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Loading conversation...</p>
                                    <p className="text-xs text-muted-foreground">Checking for existing messages</p>
                                </div>
                            </div>
                        </div>
                    ) : channel ? (
                        <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Channel channel={channel}>
                                <Window hideOnThread>
                                    <MessageList />
                                    <MessageInput focus />
                                </Window>
                            </Channel>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Empty state - no messages yet */}
                            <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
                                <div className="text-center max-w-md w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto">
                                            <MessageSquare className="h-10 w-10 text-primary" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-lg">Start a conversation</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Send a message to inquire about this vehicle. The dealer will be notified and respond shortly.
                                        </p>
                                    </div>

                                    {carInfo && (
                                        <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-4 text-left border border-border/50 shadow-sm">
                                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                <Car className="h-3 w-3" />
                                                Asking about:
                                            </p>
                                            <p className="font-semibold text-sm">
                                                {carInfo.year} {carInfo.make} {carInfo.model}
                                            </p>
                                            {carInfo.price && (
                                                <p className="text-xs text-primary font-medium mt-1">
                                                    ${Number(carInfo.price).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Message Input - Create channel on first send */}
                            <div className="border-t bg-muted/20 p-4 shrink-0">
                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                ref={inputRef}
                                                name="message"
                                                type="text"
                                                value={messageText}
                                                onChange={(e) => setMessageText(e.target.value)}
                                                placeholder="Type your message..."
                                                disabled={loading}
                                                className="w-full px-4 py-3 pr-10 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-background transition-all duration-200 placeholder:text-muted-foreground/60"
                                                aria-label="Message input"
                                            />
                                            {messageText && (
                                                <button
                                                    type="button"
                                                    onClick={() => setMessageText("")}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                    aria-label="Clear message"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading || !messageText.trim()}
                                            className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                                            aria-label="Send message"
                                        >
                                            {loading ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Send className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
