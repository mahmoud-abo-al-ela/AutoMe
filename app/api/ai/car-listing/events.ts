import type { CarListingDraft } from "@/lib/services/ai";
import type { ErrorResponse } from "@/lib/utils/response";

/**
 * One line of the car-listing stream (newline-delimited JSON). Shared by the
 * route that writes it and the hook that reads it, so the two cannot drift.
 */
export type CarListingStreamEvent =
  /** A request went to model `modelIndex + 1` of `modelCount`. */
  | { type: "attempt"; modelIndex: number; modelCount: number; retry: boolean }
  /** The model has started `done` of the `total` fields it writes. */
  | { type: "fields"; done: number; total: number }
  /** Answered from the response cache; no request was sent. */
  | { type: "cached" }
  /** Nothing new; keeps the connection open through a long provider queue. */
  | { type: "heartbeat" }
  | { type: "result"; data: CarListingDraft }
  | { type: "error"; error: ErrorResponse["error"] };
