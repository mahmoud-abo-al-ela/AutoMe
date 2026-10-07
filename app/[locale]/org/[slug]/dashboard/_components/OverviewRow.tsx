import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * One row of the overview's supporting lists: a leading badge or picture, a
 * line and its detail, and a chevron as the resting sign that the row opens
 * something. The whole row is the link. No hooks, so the server renders it
 * and the client messages row reuses it.
 */
export function OverviewRow({
  href,
  lead,
  title,
  detail,
  detailClassName,
}: {
  href: string;
  lead: ReactNode;
  title: ReactNode;
  detail: ReactNode;
  detailClassName?: string;
}) {
  return (
    <li className="border-t border-border">
      <Link
        href={href}
        className="group flex min-h-16 items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 sm:px-6"
      >
        {lead}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body font-semibold">{title}</span>
          <span className={cn("line-clamp-1 text-caption text-muted-foreground", detailClassName)}>{detail}</span>
        </span>
        <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" />
      </Link>
    </li>
  );
}

/** The count badge leading a "Waiting on you" row: marker yellow when work waits. */
export function CountBadge({ value, urgent }: { value: ReactNode; urgent?: boolean }) {
  return (
    <span
      className={cn(
        "flex h-10 min-w-10 shrink-0 items-center justify-center rounded-control px-2 text-body font-extrabold tabular-nums",
        urgent ? "bg-marker text-marker-foreground" : "bg-muted text-foreground",
      )}
    >
      {value}
    </span>
  );
}
