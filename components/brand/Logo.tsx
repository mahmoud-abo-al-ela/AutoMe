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
 *
 * `admin` is the super-admin plate: the band reads ADMIN / إدارة, so
 * staff always see they are in the platform admin, not a dealership.
 */
export function Logo({
  name = "AutoMe",
  size = "md",
  variant = "default",
  className,
}: {
  name?: string;
  size?: "md" | "lg";
  variant?: "default" | "admin";
  className?: string;
}) {
  const lg = size === "lg";
  const admin = variant === "admin";
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
          "flex justify-between gap-3 font-bold leading-[1.6]",
          "bg-plate-band",
          lg ? "px-2 text-[10px]" : "px-1.5 text-[8px]"
        )}
      >
        <span>{admin ? "ADMIN" : "EGYPT"}</span>
        <span>{admin ? "إدارة" : "مصر"}</span>
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
