import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * One of the overview's "waiting on you" cards (canvas: Dashboard A): an
 * icon, the count large, what it counts, and a line about the first item —
 * the whole card a link to where the work is done.
 *
 * `urgent` paints it marker yellow with the key shadow: work waiting on the
 * dealer that a buyer is waiting on in turn. At zero it stays calm.
 * No hooks, so the server renders it and the messages card reuses it.
 */
export function TaskCard({
  href,
  icon,
  count,
  title,
  detail,
  urgent = false,
}: {
  href: string;
  icon: ReactNode;
  count: ReactNode;
  title: ReactNode;
  detail: ReactNode;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-[176px] flex-col gap-3 rounded-sheet p-6 transition-[transform,box-shadow] duration-150",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        urgent
          ? "border-2 border-border-strong bg-marker text-marker-foreground shadow-[0_4px_0_0_var(--border-strong)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-key-pressed"
          : "border border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-border-strong/40",
      )}
    >
      <span className="flex items-center justify-between gap-4">
        <span aria-hidden className="[&_svg]:size-[26px]">
          {icon}
        </span>
        <span className="text-[2.75rem] font-black leading-none tabular-nums">{count}</span>
      </span>
      <span className="text-[1.125rem] font-extrabold leading-snug">{title}</span>
      <span className={cn("mt-auto flex items-center gap-1.5 text-caption", urgent ? "" : "text-muted-foreground")}>
        <span className="line-clamp-1">{detail}</span>
        <ArrowRight aria-hidden className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
      </span>
    </Link>
  );
}
