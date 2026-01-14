"use client";

import { useEffect, useState, useCallback } from "react";
import { getUnreadCount } from "@/actions/messages";
import { cn } from "@/lib/utils";

/**
 * Component that displays unread message count badge
 */
export function UnreadBadge({ className, showZero = false }) {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const response = await getUnreadCount();
      if (response.success) {
        const newCount = response.data.count;
        if (newCount > count) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 300);
        }
        setCount(newCount);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [count]);

  useEffect(() => {
    fetchCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchCount, 30000);

    // Listen for custom event to refresh unread count
    const handleRefresh = () => {
      fetchCount();
    };
    window.addEventListener("refresh-unread-count", handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-unread-count", handleRefresh);
    };
  }, [fetchCount]);

  if (count === 0 && !showZero) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-semibold text-white bg-red-500 rounded-full shadow-sm",
        "min-w-[18px] h-[18px] px-1.5 text-[10px] leading-none",
        isAnimating && "animate-bounce",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
