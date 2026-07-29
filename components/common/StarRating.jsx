import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Fractional 5-star display. Renders a muted 5-star base with a gold overlay
 * clipped to (rating / 5), so half/quarter ratings show precisely. Decorative
 * only — callers should surface the numeric rating as text for screen readers.
 */
export const StarRating = ({ rating = 0, size = 16, className }) => {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  const stars = [0, 1, 2, 3, 4];
  const dims = { width: size, height: size, minWidth: size };

  return (
    <span
      className={cn("relative inline-flex flex-shrink-0", className)}
      aria-hidden="true"
    >
      <span className="flex text-muted-foreground/30">
        {stars.map((i) => (
          <Star key={i} style={dims} className="fill-current" strokeWidth={0} />
        ))}
      </span>
      <span
        className="absolute inset-0 flex overflow-hidden text-yellow-400"
        style={{ width: `${pct}%` }}
      >
        {stars.map((i) => (
          <Star key={i} style={dims} className="fill-current" strokeWidth={0} />
        ))}
      </span>
    </span>
  );
};

export default StarRating;
