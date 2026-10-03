import type { LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyAction = { label: string } & ({ href: string; onClick?: never } | { onClick: () => void; href?: never });

/**
 * Public-site empty state (Figma: EmptyState). Says what happened and offers
 * the most useful next step; no illustration. The dashboards keep
 * components/common/EmptyState — this one uses site-only tokens.
 */
export function SiteEmptyState({
  icon: Icon,
  title,
  description,
  primary,
  secondary,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  primary?: EmptyAction;
  secondary?: EmptyAction;
  className?: string;
}) {
  // A link gets the button classes directly rather than <Button asChild>: this
  // renders from Server Components too, where the i18n Link suspends on the
  // locale and Radix Slot drops it.
  const render = (action: EmptyAction, variant: "marker" | "outline-strong") =>
    action.href ? (
      <Link href={action.href} className={buttonVariants({ variant, size: "xl" })}>
        {action.label}
      </Link>
    ) : (
      <Button variant={variant} size="xl" onClick={action.onClick}>
        {action.label}
      </Button>
    );

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-sheet border border-dashed border-border bg-card px-6 py-12 text-center",
        className
      )}
    >
      <span aria-hidden className="mb-1 flex size-16 items-center justify-center rounded-full border-2 border-border-strong bg-marker">
        <Icon className="size-7" />
      </span>
      <h3 className="text-h3 font-semibold">{title}</h3>
      {description && <p className="max-w-md text-caption text-muted-foreground">{description}</p>}
      {(primary || secondary) && (
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          {primary && render(primary, "marker")}
          {secondary && render(secondary, "outline-strong")}
        </div>
      )}
    </div>
  );
}
