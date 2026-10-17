import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A text input or select trigger: 44px, the strong field border, the focus ring. */
export const inputClass = (state: { error?: boolean; ai?: boolean } = {}) =>
  cn(
    "h-11 w-full rounded-control border bg-field px-3 text-body outline-none transition-colors",
    "focus-visible:ring-[3px] focus-visible:ring-ring/50 placeholder:text-muted-foreground",
    "disabled:cursor-not-allowed disabled:bg-muted/60 disabled:text-muted-foreground",
    state.error ? "border-destructive" : state.ai ? "border-[#1d4e9e] bg-[#f5f8fd]" : "border-[#8c8170]",
  );

export function Field({
  id,
  label,
  badge,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  badge?: ReactNode;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="flex items-center gap-2 text-caption font-semibold">
        {label}
        {badge}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-micro font-semibold text-destructive">
          {error}
        </p>
      ) : (
        hint && <p id={`${id}-hint`} className="text-micro text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
