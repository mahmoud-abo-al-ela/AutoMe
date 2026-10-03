import { cn } from "@/lib/utils";

export interface SpecItem {
  label: string;
  value: string;
}

/**
 * Spec readout (Figma: SpecCell) — Direction B's spec sheet. Cells are
 * separated by hairlines rather than gaps so a column of figures reads as one
 * table. `columns` is the count at the widest breakpoint; phones always get 2.
 */
export function SpecGrid({
  items,
  columns = 4,
  className,
}: {
  items: SpecItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-control border border-border bg-border",
        columns === 3 && "sm:grid-cols-3",
        columns === 4 && "sm:grid-cols-4",
        className
      )}
    >
      {items.map(({ label, value }) => (
        <div key={label} className="flex min-w-0 flex-col gap-0.5 bg-field px-3.5 py-3">
          <dt className="text-micro text-muted-foreground">{label}</dt>
          <dd className="text-caption font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
