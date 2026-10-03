import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        // Public-site variants (Figma: Button). Their colour tokens exist only
        // under the site theme, so they are not for use in the dashboards.
        //
        // marker — the one "do this next" action per view: road-marking yellow,
        // asphalt border and the hard key shadow, which presses flat on click.
        marker:
          "border-2 border-border-strong bg-marker font-semibold text-marker-foreground shadow-key hover:bg-marker-hover active:translate-y-0.5 active:shadow-key-pressed disabled:border-border disabled:bg-muted disabled:text-disabled-foreground disabled:opacity-100 disabled:shadow-none",
        inverse:
          "bg-inverse font-semibold text-inverse-foreground hover:bg-inverse-hover disabled:bg-muted disabled:text-disabled-foreground disabled:opacity-100",
        "outline-strong":
          "border-2 border-border-strong bg-field font-semibold text-foreground hover:bg-muted disabled:border-border disabled:text-disabled-foreground disabled:opacity-100",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        // Site sizes: 48px is the default touch target; 40px only in dense
        // desktop toolbars.
        control: "h-10 rounded-control px-4 has-[>svg]:px-3.5",
        xl: "h-12 rounded-control px-6 text-[0.9375rem] has-[>svg]:px-5 [&_svg:not([class*='size-'])]:size-[18px]",
        "icon-control": "size-10 rounded-control",
        "icon-xl": "size-12 rounded-control [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
