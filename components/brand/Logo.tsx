import { cn } from "@/lib/utils";

/**
 * The wordmark, set on a plate (Figma: Logo). The band reads EGYPT / مصر like
 * a real private-car plate and, like one, is laid out physically.
 *
 * On a dealership subdomain the word is the dealership's name and the plate
 * still frames it, so a storefront stays recognisably part of AutoMe. A
 * dealership logo, when there is one, sits beside the plate (MainHeader).
 *
 * Decorative text only — the surrounding link carries the accessible name.
 *
 * `lg` is the plate on its own as an object (the road loader), with the key
 * shadow the marker buttons use so it sits on the page like a real plate.
 */
export function Logo({
  name = "AutoMe",
  size = "md",
  className,
}: {
  name?: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const lg = size === "lg";
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex flex-col overflow-hidden rounded-plate border-2 border-border-strong bg-field text-foreground",
        lg && "border-[2.5px] shadow-key",
        className
      )}
    >
      <span
        dir="ltr"
        className={cn(
          "flex justify-between gap-3 bg-plate-band font-bold leading-[1.6]",
          lg ? "px-2 text-[10px]" : "px-1.5 text-[8px]"
        )}
      >
        <span>EGYPT</span>
        <span>مصر</span>
      </span>
      <span
        className={cn(
          "max-w-[12rem] truncate font-black tracking-[-0.01em]",
          lg ? "px-4 pb-0.5 text-[1.75rem] leading-[1.3]" : "px-2.5 pb-px text-[1.25rem] leading-[1.25]"
        )}
      >
        {name}
      </span>
    </span>
  );
}
