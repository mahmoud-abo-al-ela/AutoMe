"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Heart, CarFront, MessageSquare } from "lucide-react";
import { UnreadBadge } from "@/components/StreamChat";

export default function HeaderNavLink({
  href,
  label,
  icon,
  iconClass,
  size = 24,
  isMobile,
  onClick,
  isActive,
  showUnreadBadge,
}) {
  const Icon = icon ? { Heart, CarFront, MessageSquare }[icon] : null;

  // Special styling for messages icon
  const isMessagesIcon = icon === "MessageSquare";

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center text-sm font-medium transition-all duration-200 relative",
        isMobile ? "py-1 space-x-2" : "rounded-md relative overflow-hidden",
        isMessagesIcon && !isMobile
          ? "p-2"
          : !isMobile
            ? "px-3 py-2 space-x-2"
            : "space-x-2",
        isActive
          ? `text-primary font-semibold ${!isMobile ? "bg-primary/5" : ""}`
          : "hover:text-primary"
      )}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      title={label}
      aria-label={label}
    >
      {Icon && (
        <span
          className={cn(
            "relative inline-flex items-center justify-center",
            isMessagesIcon &&
            !isMobile &&
            "p-1.5 rounded-full hover:bg-muted/80 transition-colors"
          )}
        >
          <Icon
            size={isMessagesIcon ? 22 : size}
            className={cn(
              iconClass,
              isActive ? "text-primary" : "",
              "transition-transform duration-300 group-hover:scale-110"
            )}
          />
          {showUnreadBadge && (
            <UnreadBadge className="absolute -top-0.5 -right-0.5" />
          )}
        </span>
      )}
      {!icon && (
        <>
          <span className={isActive ? "font-medium" : ""}>{label}</span>
          {!isMobile && isActive && (
            <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary transform origin-left transition-transform duration-300" />
          )}
          {!isMobile && !isActive && (
            <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary transform origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
          )}
        </>
      )}
    </Link>
  );
}
