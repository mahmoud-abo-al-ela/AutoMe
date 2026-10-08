import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The top of every dashboard page (Figma: Dashboard — page header): the
 * page's title, one line on what it is for, and its actions at the far end —
 * at most one of them marker yellow, the page's main action. The same shape
 * as the public site's plain PageHeader, at the work-mode scale.
 */
export function OrgPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between md:mb-8",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-h1 font-extrabold">{title}</h1>
        {description && <p className="max-w-[48rem] text-body text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
