"use client";
import { logError } from "@/lib/utils/errors";

import { useEffect } from "react";
import {
    Channel,
    MessageInput,
    MessageList,
    Thread,
    Window,
    useChatContext,
} from "stream-chat-react";
import { MessageSquare, Car, Building2, DollarSign } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";

function DMChannelHeader({ channel }) {
    const { client } = useChatContext();

    // Get the other user in the conversation
    const members = Object.values(channel.state.members);
    const otherMember = members.find((member) => member.user.id !== client.userID);
    const otherUser = otherMember?.user;

    // Get car and organization data from channel data
    const carData = channel.data?.car_data;
    const organizationData = channel.data?.organization_data;

    // Determine if current user is organization member
    const isOrgMember = channel.data?.organization_id &&
        members.some(m => m.user.id === client.userID && m.user.custom?.user_role);

    // For regular users, show car info in header
    // For org members, show customer info
    const showCarInHeader = !isOrgMember && carData;
    const showOrgInHeader = !isOrgMember && !carData && organizationData;

    return (
        <div className="border-b bg-background">
            <div className="px-4 py-3 flex items-center gap-3 bg-gradient-to-r from-background via-muted/10 to-background">
                {/* Avatar - Car Image for users, User Avatar for org members */}
                {showCarInHeader ? (
                    <Avatar className="h-11 w-11 ring-2 ring-primary/20 shadow-sm rounded-lg">
                        {carData.images?.[0] ? (
                            <AvatarImage
                                src={carData.images[0]}
                                alt={carData.title}
                                className="object-cover"
                            />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
                            <Car className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                    </Avatar>
                ) : showOrgInHeader ? (
                    <Avatar className="h-11 w-11 ring-2 ring-primary/20 shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                            <Building2 className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                    </Avatar>
                ) : (
                    <Avatar className="h-11 w-11 ring-2 ring-primary/20 shadow-sm">
                        {otherUser?.image ? (
                            <AvatarImage src={otherUser.image} alt={otherUser.name} />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                            <Building2 className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                    </Avatar>
                )}

                {/* Info */}
                <div className="flex justify-between items-center w-full">
                    <div>
                        <h3 className="font-semibold text-base truncate">
                            {carData.title}
                        </h3>
                        {carData.price && (
                            <div className="flex items-center text-sm text-muted-foreground">
                                <span className="font-medium text-primary">
                                    ${Number(carData.price).toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                    <Link
                        href={`/cars/${carData.id}`}
                    >
                        <Button size="sm" className="h-7 px-2 text-xs bg-primary hover:bg-primary/80 cursor-pointer"
                        >
                            View Details
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export function ChatWindow() {
    const { channel } = useChatContext();

    // Mark channel as read when it becomes active
    useEffect(() => {
        if (channel) {
            // Mark the channel as read when user opens it
            channel.markRead().catch((error) => {
                logError("Error marking channel as read:", error);
            });
        }
    }, [channel]);

    if (!channel) {
        return (
            <div className="flex-1 flex items-center justify-center text-center p-8 bg-background">
                <div className="max-w-sm">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <MessageSquare className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base md:text-lg mb-2">
                        Select a conversation
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Choose a conversation from the list to start messaging
                    </p>
                </div>
            </div>
        );
    }

    return (
        <Channel channel={channel} markReadOnMount={false}>
            <Window>
                <DMChannelHeader channel={channel} />
                <MessageList />
                <MessageInput />
            </Window>
            <Thread />
        </Channel>
    );
}
