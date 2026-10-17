"use client";

import { useId } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type DrawerNavItem = { href: string; label: string; current: boolean; badge?: React.ReactNode };
export type DrawerNavGroup = { key: string; title: string; items: DrawerNavItem[] };

export function DrawerNavGroups({
  label,
  groups,
  onNavigate,
  indicatorClassName = "bg-marker",
}: {
  label: string;
  groups: DrawerNavGroup[];
  onNavigate: () => void;
  /** The current section's start bar: the dealer's marker, or the admin's own ink. */
  indicatorClassName?: string;
}) {
  const id = useId();
  return (
    <nav aria-label={label} className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
      {groups
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <div key={group.key} role="group" aria-labelledby={`${id}-${group.key}`}>
            <h3
              id={`${id}-${group.key}`}
              className="px-4 pb-1 text-micro font-semibold uppercase tracking-wide text-inverse-foreground/50"
            >
              {group.title}
            </h3>
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={item.current ? "page" : undefined}
                    className={cn(
                      "relative flex h-12 items-center gap-3 rounded-control px-4 text-body transition-colors",
                      item.current
                        ? "bg-inverse-hover font-semibold"
                        : "text-inverse-foreground/75 hover:bg-inverse-hover hover:text-inverse-foreground"
                    )}
                  >
                    {item.current && (
                      <span aria-hidden className={cn("absolute inset-y-2 start-0 w-1 rounded-e-full", indicatorClassName)} />
                    )}
                    <span className="flex-1">{item.label}</span>
                    {item.badge}
                    <ChevronRight aria-hidden className="size-4 text-inverse-foreground/40 rtl:rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </nav>
  );
}
