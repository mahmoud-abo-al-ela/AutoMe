import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A titled block of the dashboard (Figma: Dashboard — panel): white on the
 * limestone page, hairline border, the site's sheet radius. Title and an
 * optional line of description on the starting side, its own controls (a
 * range picker, a link) at the far end.
 *
 * No hooks, so it serves server and client components alike.
 */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-sheet border border-border bg-card", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex min-w-0 flex-col gap-1">
            {title && <h2 className="text-h3 font-bold">{title}</h2>}
            {description && <p className="text-caption text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={cn("flex flex-1 flex-col p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

/** What a panel shows with nothing in it yet: an icon, a line, and why. */
export function PanelEmpty({
  icon: Icon,
  title,
  body,
  className,
}: {
  icon: LucideIcon;
  title: ReactNode;
  body?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center", className)}>
      <span aria-hidden className="mb-2 flex size-14 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </span>
      <p className="text-body font-semibold">{title}</p>
      {body && <p className="max-w-xs text-caption text-muted-foreground">{body}</p>}
    </div>
  );
}

export type StatItem = {
  key: string;
  label: ReactNode;
  value: ReactNode;
  icon?: LucideIcon;
  /** A line under the figure: a comparison, or what the figure counts. */
  note?: ReactNode;
};

const COLUMNS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 xl:grid-cols-4",
} as const;

/**
 * The headline figures of a page, read across as one strip — the public
 * site's spec readout at dashboard size: cells divided by hairlines inside
 * one rounded frame, the figure large and tabular so a column of them lines
 * up. Values arrive formatted (Eastern digits on /ar).
 */
export function StatGrid({
  items,
  columns = 3,
  className,
}: {
  items: StatItem[];
  columns?: keyof typeof COLUMNS;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-px overflow-hidden rounded-sheet border border-border bg-border",
        COLUMNS[columns],
        className,
      )}
    >
      {items.map(({ key, label, value, icon: Icon, note }) => (
        <div key={key} className="flex min-w-0 flex-col gap-3 bg-card p-5 sm:p-6">
          <dt className="flex items-center gap-2.5 text-caption font-medium text-muted-foreground">
            {Icon && (
              <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                <Icon className="size-4" />
              </span>
            )}
            {label}
          </dt>
          <dd className="truncate text-[1.75rem] font-black leading-none tabular-nums sm:text-[2rem]">{value}</dd>
          {note && <dd className="text-caption text-muted-foreground">{note}</dd>}
        </div>
      ))}
    </dl>
  );
}
