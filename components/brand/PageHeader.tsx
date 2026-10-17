import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
        <p className={cn("text-caption font-semibold", inverse ? "text-inverse-foreground/70" : "text-muted-foreground")}>
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
