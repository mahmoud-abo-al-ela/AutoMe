/** Class names and status tones shared by the dealership record's tabs. */

export const panel = "overflow-hidden rounded-[20px] border border-border bg-card";
export const th =
  "px-3 py-3 text-center font-semibold first:ps-4 first:text-start sm:first:ps-5";
export const td = "px-3 py-3 text-center first:ps-4 first:text-start sm:first:ps-5";
export const chip =
  "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-caption transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
export const chipOn =
  "border-inverse bg-inverse font-semibold text-inverse-foreground";
export const chipOff = "border-border bg-field text-foreground hover:bg-muted";
export const trigger = "h-10 data-[size=default]:h-10 rounded-control border-[#8c8170] bg-field";
export const CAR_TONES: Record<string, string> = {
  AVAILABLE: "bg-positive-soft text-positive",
  UNAVAILABLE: "bg-muted text-muted-foreground",
  SOLD: "bg-[#e7eef8] text-[#1d4e9e]",
};
export const PAYMENT_TONES: Record<string, string> = {
  PAID: "bg-positive-soft text-positive",
  FAILED: "bg-destructive-soft text-destructive",
  REFUNDED: "bg-muted text-muted-foreground",
  EXPIRED: "bg-muted text-muted-foreground",
  PENDING: "bg-[#fff1c2] text-[#7a5200]",
};
