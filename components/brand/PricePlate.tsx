"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";

const plateVariants = cva(
  "inline-flex flex-col overflow-hidden rounded-plate border-2 border-border-strong bg-field text-foreground shadow-key",
  {
    variants: {
      size: {
        sm: "[--band:9px] [--digits:1.125rem] [--px:0.625rem]",
        md: "[--band:10px] [--digits:1.5rem] [--px:0.875rem]",
        lg: "[--band:12px] [--digits:2.125rem] [--px:1.125rem]",
      },
    },
    defaultVariants: { size: "md" },
  }
);

/**
 * A listing price, drawn as an Egyptian private-car licence plate: the
 * light-blue band, the heavy border, the number in the body.
 *
 * Price only. The shape is the brand's one strong motif, and it stays
 * meaningful only while it means exactly one thing — never decoration, never
 * a plan's monthly price.
 *
 * The band is laid out physically, like the real plate (EGP on the left,
 * ج.م. on the right) whatever the page direction. The visual is hidden from
 * assistive tech and the formatted price is read instead, so "EGP 875,000"
 * is announced rather than "EGP, ج.م., 875,000".
 */
export function PricePlate({
  amount,
  currency,
  size,
  className,
}: VariantProps<typeof plateVariants> & {
  /** Major units, as stored on Car.price. */
  amount: number;
  currency?: string;
  className?: string;
}) {
  const fmt = useFormatters();

  return (
    <span className={cn(plateVariants({ size }), className)}>
      <span className="sr-only">{fmt.price(amount, currency)}</span>
      <span
        aria-hidden
        dir="ltr"
        className="flex items-center justify-between gap-3 bg-plate-band px-1.5 text-[length:var(--band)] font-bold leading-[1.5]"
      >
        <span>EGP</span>
        <span>ج.م.</span>
      </span>
      <span
        aria-hidden
        className="px-[var(--px)] pb-0.5 text-center text-[length:var(--digits)] font-bold leading-[1.2] tracking-[0.02em] tabular-nums"
      >
        {fmt.number(amount)}
      </span>
    </span>
  );
}
