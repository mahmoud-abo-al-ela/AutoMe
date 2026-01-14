"use client";

import { useState, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Message input component with auto-resize textarea
 */
export function MessageInput({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
  onTyping,
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleChange = (e) => {
    setValue(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }

    // Trigger typing indicator
    if (onTyping) {
      onTyping();

      // Debounce typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        // Stop typing after 2 seconds of inactivity
      }, 2000);
    }
  };

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();

      const trimmedValue = value.trim();
      if (!trimmedValue || disabled) return;

      setValue("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      await onSend(trimmedValue);
    },
    [value, disabled, onSend]
  );

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex just items-end gap-2 p-3 sm:p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-inset-bottom"
    >
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "w-full resize-none rounded-2xl border border-input bg-muted/50 px-4 py-2.5 text-sm",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "max-h-[100px] sm:max-h-[120px] min-h-[42px]"
          )}
        />
      </div>

      <Button
        type="submit"
        size="icon"
        disabled={disabled || !value.trim()}
        className="h-[42px] w-[42px] sm:h-11 sm:w-11 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex-shrink-0 shadow-lg disabled:opacity-50 disabled:shadow-none transition-all"
      >
        <Send className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}
