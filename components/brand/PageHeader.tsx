import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The header of a content page (About, Contact, FAQ, legal).
 *
 * - `inverse`: an asphalt panel like the home hero, but shorter and without
 *   the search. For marketing pages that open the visit. Pass `aside` to fill
 *   the panel's second column (the home hero has its photo there) — without
 *   one the copy keeps a reading width and the panel stays compact.
 * - `plain`: the title over a hairline, the same shape as the Browse and
 *   Dealerships headers. For reference pages people arrive at to read.
 *
 * `accent` is the clause set in marker yellow (inverse) or primary (plain),
 * kept as its own message so a translation can place it anywhere in the line.
 */
export function PageHeader({
  eyebrow,
  title,
  accent,
  subtitle,
  tone = "plain",
  aside,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  subtitle?: ReactNode;
  tone?: "plain" | "inverse";
  aside?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const inverse = tone === "inverse";

  const body = (
    <div className={cn("flex flex-col gap-4", inverse && "max-w-3xl gap-5")}>
      {eyebrow && (
        <p
          className={cn(
            "flex w-fit items-center gap-2 text-micro font-semibold",
            inverse ? "rounded-full bg-inverse-foreground/10 px-3 py-1.5" : "text-muted-foreground",
          )}
        >
          <span aria-hidden className="size-2 rounded-full border border-border-strong bg-marker" />
          {eyebrow}
        </p>
      )}
      <h1 className={inverse ? "text-display font-black" : "text-h1 font-extrabold"}>
        {title}
        {accent && (
          <>
            {" "}
            <span className={inverse ? "text-marker" : "text-primary"}>{accent}</span>
          </>
        )}
      </h1>
      {subtitle && (
        <p
          className={cn(
            "max-w-[40rem] text-body",
            inverse ? "text-inverse-foreground/75 sm:text-[1.125rem]" : "text-muted-foreground",
          )}
        >
          {subtitle}
        </p>
      )}
      {children && <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{children}</div>}
    </div>
  );

  if (!inverse) {
    return <header className={cn("mb-8 border-b border-border pb-6 lg:mb-10", className)}>{body}</header>;
  }

  return (
    <header className={cn("px-3 pt-3 sm:px-6 sm:pt-6 xl:px-10", className)}>
      <div
        className={cn(
          "mx-auto grid max-w-[1360px] grid-cols-1 gap-8 overflow-hidden rounded-sheet bg-inverse px-5 py-8 text-inverse-foreground sm:px-10 sm:py-12 md:rounded-hero lg:gap-12 lg:px-14 lg:py-14",
          aside && "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center",
        )}
      >
        {body}
        {aside}
      </div>
    </header>
  );
}
