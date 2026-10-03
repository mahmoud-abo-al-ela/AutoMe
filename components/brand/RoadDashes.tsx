import { cn } from "@/lib/utils";

/**
 * Road-marking dashes (Figma: road dashes). Decorative divider; the dash
 * pattern is a repeating gradient so it fills any width without counting.
 */
export function RoadDashes({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block h-1.5 w-full rounded-full bg-[repeating-linear-gradient(to_right,var(--marker)_0_32px,transparent_32px_46px)] rtl:bg-[repeating-linear-gradient(to_left,var(--marker)_0_32px,transparent_32px_46px)]",
        className
      )}
    />
  );
}
