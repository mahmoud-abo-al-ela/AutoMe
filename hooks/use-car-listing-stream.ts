"use client";

import { useCallback, useRef, useState } from "react";
import type { CarListingDraft } from "@/lib/services/ai";
import type { ErrorResponse } from "@/lib/utils/response";
import type { CarListingStreamEvent } from "@/app/api/ai/car-listing/events";

/**
 * Where an AI photo extraction actually is. Every value here comes from a real
 * event — bytes the browser has sent, a request the server sent to a model, a
 * field the model has written. The one stretch with no signal is Google's
 * queue ("waiting"), and it is shown as that, with a clock, not as a fake %.
 */
export interface CarListingProgress {
  phase: "uploading" | "waiting" | "writing" | "done";
  /** 0–1, bytes of the photo sent. */
  uploaded: number;
  /** 0-based model in the chain; > 0 means an earlier model was busy. */
  modelIndex: number;
  modelCount: number;
  retry: boolean;
  fieldsDone: number;
  fieldsTotal: number;
}

const INITIAL: CarListingProgress = {
  phase: "uploading",
  uploaded: 0,
  modelIndex: 0,
  modelCount: 0,
  retry: false,
  fieldsDone: 0,
  fieldsTotal: 0,
};

/** A failed extraction, carrying the server's error for useActionError. */
export class CarListingStreamError extends Error {
  constructor(readonly error: ErrorResponse["error"] | undefined) {
    super(error?.message ?? "AI extraction failed");
  }
}

const ENDPOINT = "/api/ai/car-listing";

/**
 * Stream a car listing out of a photo.
 *
 * XMLHttpRequest rather than fetch: it is the only browser API that reports
 * UPLOAD progress, and it exposes the response as it grows, which is all a
 * newline-delimited stream needs.
 */
export function useCarListingStream() {
  const [progress, setProgress] = useState<CarListingProgress | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const extract = useCallback((file: File): Promise<CarListingDraft> => {
    xhrRef.current?.abort();
    setProgress(INITIAL);

    return new Promise<CarListingDraft>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      let read = 0;
      let settled = false;

      const finish = (outcome: () => void) => {
        if (settled) return;
        settled = true;
        outcome();
      };

      const apply = (event: CarListingStreamEvent) => {
        switch (event.type) {
          case "attempt":
            setProgress((p) => ({
              ...(p ?? INITIAL),
              phase: "waiting",
              uploaded: 1,
              modelIndex: event.modelIndex,
              modelCount: event.modelCount,
              retry: event.retry,
              // A new attempt starts its reply from nothing.
              fieldsDone: 0,
            }));
            return;
          case "fields":
            setProgress((p) => ({
              ...(p ?? INITIAL),
              phase: "writing",
              uploaded: 1,
              fieldsDone: event.done,
              fieldsTotal: event.total,
            }));
            return;
          case "cached":
          case "heartbeat":
            return;
          case "result":
            setProgress((p) => ({ ...(p ?? INITIAL), phase: "done", uploaded: 1 }));
            finish(() => resolve(event.data));
            return;
          case "error":
            finish(() => reject(new CarListingStreamError(event.error)));
            return;
        }
      };

      /** Consume every complete line received since the last call. */
      const drain = () => {
        const text = xhr.responseText;
        let newline = text.indexOf("\n", read);
        while (newline !== -1) {
          const line = text.slice(read, newline).trim();
          read = newline + 1;
          if (line) {
            try {
              apply(JSON.parse(line) as CarListingStreamEvent);
            } catch {
              // A malformed line is skipped; the result or error line decides.
            }
          }
          newline = text.indexOf("\n", read);
        }
      };

      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        setProgress((p) => ({ ...(p ?? INITIAL), uploaded: e.loaded / e.total }));
      };
      xhr.upload.onload = () => {
        // Sent. From here until a model answers, the wait is the provider's.
        setProgress((p) => ({ ...(p ?? INITIAL), phase: "waiting", uploaded: 1 }));
      };

      xhr.onprogress = () => {
        if (xhr.status === 200) drain();
      };

      xhr.onload = () => {
        if (xhr.status !== 200) {
          // Refused before streaming: a real status with a JSON error body.
          let body: ErrorResponse | null = null;
          try {
            body = JSON.parse(xhr.responseText) as ErrorResponse;
          } catch {
            // Not JSON — a platform error page, e.g. a timeout at the edge.
          }
          finish(() => reject(new CarListingStreamError(body?.error)));
          return;
        }
        drain();
        // The stream ended without a result or error line: cut off mid-way.
        finish(() => reject(new CarListingStreamError(undefined)));
      };

      xhr.onerror = () => finish(() => reject(new CarListingStreamError(undefined)));
      xhr.onabort = () => finish(() => reject(new CarListingStreamError(undefined)));

      const body = new FormData();
      body.append("file", file);
      xhr.open("POST", ENDPOINT);
      xhr.send(body);
    });
  }, []);

  const reset = useCallback(() => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setProgress(null);
  }, []);

  return { progress, extract, reset };
}
