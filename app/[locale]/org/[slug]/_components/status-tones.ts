import type { CarStatus, TestDriveStatus } from "@/lib/generated/prisma";

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
