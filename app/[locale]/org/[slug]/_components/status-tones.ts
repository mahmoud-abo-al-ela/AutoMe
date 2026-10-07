import type { CarStatus, TestDriveStatus } from "@/lib/generated/prisma";

/**
 * One colour per status across the dashboard — the badges, the charts and the
 * stat strips — so a status reads the same wherever it appears. Site tokens
 * only (globals.css), never raw Tailwind colours.
 *
 * `badge` is the soft pill; `color` is the solid fill for charts and dots.
 */
export const CAR_STATUS_TONE = {
  AVAILABLE: { badge: "bg-positive-soft text-positive", color: "var(--positive)" },
  SOLD: { badge: "bg-primary-soft text-primary", color: "var(--primary)" },
  UNAVAILABLE: { badge: "bg-muted text-muted-foreground", color: "var(--price-fair)" },
} as const satisfies Record<CarStatus, { badge: string; color: string }>;

/** Waiting on the dealer is marker yellow: the one that asks for action. */
export const TEST_DRIVE_STATUS_TONE = {
  PENDING: { badge: "bg-marker-soft text-marker-foreground", color: "var(--marker)" },
  CONFIRMED: { badge: "bg-primary-soft text-primary", color: "var(--primary)" },
  COMPLETED: { badge: "bg-positive-soft text-positive", color: "var(--positive)" },
  CANCELLED: { badge: "bg-destructive-soft text-destructive", color: "var(--destructive)" },
} as const satisfies Record<TestDriveStatus, { badge: string; color: string }>;
