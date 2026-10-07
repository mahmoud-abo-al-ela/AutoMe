"use client";

import { useTranslations } from "next-intl";
import { Eye, EyeOff, MoreHorizontal, Pencil, Star, StarOff, Tag, Trash2, CircleCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { InventoryRow } from "@/lib/services/dashboard";
import type { CarChange } from "@/hooks/use-inventory";
import { cn } from "@/lib/utils";

/**
 * One car's actions: open it, edit it, feature it, move it between on sale,
 * hidden and sold, delete it. Deleting asks first (the caller's dialog); the
 * rest are undone from this same menu, so they act at once.
 */
export function RowMenu({
  car,
  name,
  base,
  busy,
  onChange,
  onDelete,
}: {
  car: InventoryRow;
  name: string;
  base: string;
  busy: boolean;
  onChange: (change: CarChange) => void;
  onDelete: () => void;
}) {
  const t = useTranslations("org.cars.ledger.row");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("menu", { car: name })}
        disabled={busy}
        className={cn(
          "inline-flex size-10 cursor-pointer items-center justify-center rounded-control text-foreground transition-colors hover:bg-muted",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {busy ? (
          <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        ) : (
          <MoreHorizontal aria-hidden className="size-5" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <a href={`/cars/${car.id}`} target="_blank" rel="noopener">
            <Eye aria-hidden /> {t("view")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`${base}/cars/${car.id}/edit`}>
            <Pencil aria-hidden /> {t("edit")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onChange(car.featured ? "unfeature" : "feature")}>
          {car.featured ? <StarOff aria-hidden /> : <Star aria-hidden />} {car.featured ? t("unfeature") : t("feature")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {car.status !== "AVAILABLE" && (
          <DropdownMenuItem onSelect={() => onChange("putOnSale")}>
            <Tag aria-hidden /> {t("putOnSale")}
          </DropdownMenuItem>
        )}
        {car.status !== "UNAVAILABLE" && (
          <DropdownMenuItem onSelect={() => onChange("hide")}>
            <EyeOff aria-hidden /> {t("hide")}
          </DropdownMenuItem>
        )}
        {car.status !== "SOLD" && (
          <DropdownMenuItem onSelect={() => onChange("markSold")}>
            <CircleCheck aria-hidden /> {t("markSold")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 aria-hidden /> {t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
