import { cn } from "@/lib/utils";
import type { PlateBand } from "@/lib/org/client";

const BANDS: Record<PlateBand, { latin: string; arabic: string; className: string }> = {
  buyer: { latin: "EGYPT", arabic: "مصر", className: "bg-plate-band text-plate-band-foreground" },
  owner: { latin: "OWNER", arabic: "مالك", className: "bg-plate-owner text-plate-owner-foreground" },
  team: { latin: "TEAM", arabic: "فريق", className: "bg-plate-team text-plate-team-foreground" },
  admin: { latin: "ADMIN", arabic: "إدارة", className: "bg-plate-admin text-plate-admin-foreground" },
};

export function Logo({
  name = "AutoMe",
  size = "md",
  band = "buyer",
  className,
}: {
  name?: string;
  size?: "md" | "lg";
  band?: PlateBand;
  className?: string;
}) {
  const lg = size === "lg";
  const { latin, arabic, className: bandClassName } = BANDS[band];
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
          bandClassName,
          lg ? "px-2 text-[10px]" : "px-1.5 text-[8px]"
        )}
      >
        <span>{latin}</span>
        <span>{arabic}</span>
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
