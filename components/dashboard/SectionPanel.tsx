import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A titled panel with a ruled header: the section blocks of Settings and
 * Billing (canvas: Settings round 1, "2 · Storefront"). The overview and
 * Insights use Panel, a lighter card for charts and stats.
 */
export function SectionPanel({
  title,
  hint,
  action,
  className,
  children,
}: {
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-[20px] border border-border bg-card", className)}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-4 py-4 sm:px-[22px]">
        <h2 className="text-[1.25rem] font-extrabold leading-tight">{title}</h2>
        {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
        {action && <div className="ms-auto">{action}</div>}
      </header>
      <div className="px-4 py-4 sm:px-[22px] sm:py-[18px]">{children}</div>
    </section>
  );
}
