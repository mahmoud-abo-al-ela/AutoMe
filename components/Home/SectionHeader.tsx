import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function SectionHeader({
  id,
  title,
  subtitle,
  action,
  className,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 sm:mb-8", className)}>
      <div className="flex flex-col gap-1.5">
        <h2 id={id} className="text-h1 font-extrabold">
          {title}
        </h2>
        {subtitle && <p className="text-body text-muted-foreground">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex min-h-11 items-center gap-1.5 text-caption font-semibold text-primary hover:underline"
        >
          {action.label}
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
