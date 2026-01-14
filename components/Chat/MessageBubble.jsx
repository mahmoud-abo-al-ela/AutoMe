"use client";

import Image from "next/image";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Single message bubble component
 */
export function MessageBubble({ message, isOwn, showAvatar = true }) {
  const createdAt =
    typeof message.createdAt === "string"
      ? parseISO(message.createdAt)
      : message.createdAt;

  const formatTime = (date) => {
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "HH:mm")}`;
    }
    return format(date, "MMM d, HH:mm");
  };

  return (
    <div
      className={cn(
        "flex gap-2 sm:gap-2.5 max-w-[88%] sm:max-w-[80%]",
        isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      {showAvatar &&
        !isOwn &&
        (message.sender?.imageUrl ? (
          <Image
            src={message.sender.imageUrl}
            alt={message.sender?.name || "User"}
            width={32}
            height={32}
            className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-background shadow-sm"
          />
        ) : (
          <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs sm:text-sm font-medium ring-2 ring-background shadow-sm">
            {message.sender?.name?.[0]?.toUpperCase() || "?"}
          </div>
        ))}
      {!showAvatar && !isOwn && <div className="w-8 sm:w-9" />}

      {/* Message content */}
      <div
        className={cn(
          "flex flex-col gap-0.5 sm:gap-1",
          isOwn ? "items-end" : "items-start"
        )}
      >
        {/* Sender name (only for received messages) */}
        {showAvatar && !isOwn && message.sender?.name && (
          <span className="text-[11px] sm:text-xs text-muted-foreground font-medium px-1 mb-0.5">
            {message.sender.name}
          </span>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-[13px] sm:text-sm break-words leading-relaxed shadow-sm",
            isOwn
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-md"
              : "bg-muted rounded-bl-md",
            message._pending && "opacity-70"
          )}
        >
          {message.content}
        </div>

        {/* Timestamp and status */}
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-[10px] sm:text-[11px] text-muted-foreground">
            {formatTime(createdAt)}
          </span>
          {isOwn && message.readAt && (
            <span className="text-[10px] sm:text-[11px] text-blue-500 font-medium">✓✓</span>
          )}
          {isOwn && !message.readAt && !message._pending && (
            <span className="text-[10px] sm:text-[11px] text-muted-foreground">
              ✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Date separator component
 */
export function DateSeparator({ date }) {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;

  const formatDate = (d) => {
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMMM d, yyyy");
  };

  return (
    <div className="flex items-center gap-3 sm:gap-4 my-4 sm:my-5">
      <div className="flex-1 h-px bg-border/60" />
      <span className="text-[11px] sm:text-xs text-muted-foreground font-medium px-2 py-1 bg-muted/50 rounded-full">
        {formatDate(parsedDate)}
      </span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

/**
 * Typing indicator component
 */
export function TypingIndicator({ users }) {
  if (!users || users.length === 0) return null;

  const names = users.map((u) => u.name || "Someone").join(", ");

  return (
    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5">
      <div className="flex gap-1 px-3 py-2 bg-muted rounded-2xl rounded-bl-md">
        <span
          className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span className="text-[11px] sm:text-xs text-muted-foreground">
        {names} is typing...
      </span>
    </div>
  );
}
