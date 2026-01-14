"use client";

import Image from "next/image";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { MessageSquare, Car } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Single conversation item in the list
 */
export function ConversationItem({ conversation, isActive, onClick }) {
  const lastMessage = conversation.lastMessage || conversation.messages?.[0];
  const otherParticipants =
    conversation.participants?.filter((p) => p.role !== "USER") || [];
  const car = conversation.car;
  const hasUnread = conversation.unreadCount > 0;

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;

    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return "Yesterday";
    }
    return format(date, "MMM d");
  };

  // Get display name - show car or admin names
  const displayName = car
    ? car.title || `${car.make} ${car.model} ${car.year}`
    : otherParticipants.map((p) => p.name).join(", ") || "Conversation";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 text-left transition-all duration-200 border-b cursor-pointer group relative",
        isActive
          ? "bg-blue-50 border-l-2 border-l-blue-500"
          : "hover:bg-slate-50 border-l-2 border-l-transparent hover:border-l-slate-200",
        hasUnread && !isActive && "bg-blue-50/50"
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 relative">
        {car?.images?.[0] ? (
          <Image
            src={car.images[0]}
            alt={displayName}
            width={48}
            height={48}
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover transition-transform duration-200 shadow-sm",
              "group-hover:shadow-md group-hover:scale-105"
            )}
          />
        ) : (
          <div
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm transition-all duration-200",
              "group-hover:shadow-md group-hover:scale-105"
            )}
          >
            {car ? (
              <Car className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            ) : (
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            )}
          </div>
        )}
        {/* Online indicator dot */}
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
          <h3
            className={cn(
              "text-xs sm:text-sm truncate transition-colors",
              hasUnread
                ? "font-semibold text-slate-900"
                : "font-medium text-slate-700"
            )}
          >
            {displayName}
          </h3>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {lastMessage && (
              <span
                className={cn(
                  "text-[10px] sm:text-xs",
                  hasUnread
                    ? "text-blue-600 font-medium"
                    : "text-muted-foreground"
                )}
              >
                {formatTime(lastMessage.createdAt)}
              </span>
            )}
          </div>
        </div>

        {/* Last message preview */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
          {lastMessage ? (
            <p
              className={cn(
                "text-xs sm:text-sm truncate flex-1",
                hasUnread
                  ? "text-slate-700 font-medium"
                  : "text-muted-foreground"
              )}
            >
              {lastMessage.content}
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground italic">
              No messages yet
            </p>
          )}
          {hasUnread && (
            <span className="flex-shrink-0 min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 px-1 sm:px-1.5 bg-blue-500 text-white text-[10px] sm:text-xs font-semibold rounded-full flex items-center justify-center">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * Conversation list component
 */
export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  loading,
  emptyMessage = "No conversations yet",
}) {
  if (loading) {
    return (
      <div className="space-y-1 p-2 sm:p-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg animate-pulse"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-200" />
            <div className="flex-1 space-y-1.5 sm:space-y-2">
              <div className="h-3 sm:h-4 bg-slate-200 rounded-full w-3/4" />
              <div className="h-2.5 sm:h-3 bg-slate-100 rounded-full w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-center p-4 sm:p-6">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 sm:mb-4">
          <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isActive={conversation.id === activeConversationId}
          onClick={() => onSelectConversation(conversation)}
        />
      ))}
    </div>
  );
}
