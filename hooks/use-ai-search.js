"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { searchCarsWithNaturalLanguage } from "@/actions/ai-search";
import { DEFAULT_PER_PAGE } from "@/lib/constants/car-options";
import {
  DEFAULT_FILTERS,
  buildCarsUrl,
  buildActiveFilterChips,
} from "./cars-page-filters";

// The action's own floor (nlSearchQuerySchema.min(3)); guard the client so a
// too-short query never makes a wasted round-trip that only comes back invalid.
const MIN_QUERY_LENGTH = 3;

// Sources that mean something to the user. "unavailable" (no key) and "fallback"
// (validation / low-confidence) degrade to a silent plain-text search — exactly
// today's behaviour — so they show no banner. The quota states are informational,
// not errors: they render in the same banner, muted.
const BANNER_SOURCES = new Set(["rules", "cache", "model", "quota_daily", "quota_minute"]);
const QUOTA_SOURCES = new Set(["quota_daily", "quota_minute"]);

// Map the AI envelope's filter object (null / [] for empties) onto a full filters
// object in the page's own shape, so applying it is a clean replace, not a merge
// that could leave a stale filter behind.
function aiFiltersToPatch(aiFilters) {
  const patch = { ...DEFAULT_FILTERS };
  const scalars = [
    "search", "color", "minSeats",
    "minPrice", "maxPrice", "minYear", "maxYear", "minMileage", "maxMileage",
  ];
  for (const key of scalars) {
    if (aiFilters[key] !== null && aiFilters[key] !== undefined) patch[key] = aiFilters[key];
  }
  for (const key of ["make", "bodyType", "fuelType", "transmission"]) {
    if (Array.isArray(aiFilters[key]) && aiFilters[key].length) patch[key] = aiFilters[key];
  }
  if (aiFilters.sortBy) patch.sortBy = aiFilters.sortBy;
  return patch;
}

// A readable summary of what was applied, built from the same chips the page shows
// — so the banner never drifts from the active-filter row. Works for every source
// (the model's `interpretation` is empty on the rules and quota paths).
function summarizeFilters(filters) {
  return buildActiveFilterChips(filters).map((chip) => chip.label).join(", ");
}

// Two filter sets are "the same" iff they serialize to the same /cars URL. Fixing
// page + perPage means pagination and page-size changes don't count as a filter
// change — only real filter edits do, which is exactly when the banner should clear.
function filterSignature(filters) {
  return buildCarsUrl(filters, 1, DEFAULT_PER_PAGE);
}

/**
 * The natural-language search concern, composed into use-cars-page so that hook
 * doesn't grow. Owns the "Ask AI" round-trip, applies the translated filters
 * through the page's existing applyPatch, and tracks the interpretation banner.
 *
 * @param {object} opts
 * @param {(patch: object) => void} opts.applyPatch - page's filter applier
 * @param {object} opts.filters - current committed filters (drives banner clearing)
 */
export function useAiSearch({ applyPatch, filters }) {
  const [aiResult, setAiResult] = useState(null); // banner data, or null when silent
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  // Guards against an out-of-order response overwriting a newer one.
  const requestIdRef = useRef(0);

  const runAiSearch = useCallback(
    async (rawQuery) => {
      const query = (rawQuery || "").trim();
      if (query.length < MIN_QUERY_LENGTH) return;

      const requestId = ++requestIdRef.current;
      setAiLoading(true);
      setAiError(null);

      try {
        const res = await searchCarsWithNaturalLanguage(query);
        if (requestId !== requestIdRef.current) return; // superseded

        if (!res?.success) {
          // Rate limited or an unexpected server error: still give the user
          // results by running their text as a plain search, and say so quietly.
          applyPatch({ ...DEFAULT_FILTERS, search: query });
          setAiResult(null);
          setAiError("AI search is unavailable right now — showing plain results.");
          return;
        }

        const { filters: aiFilters, unmapped, source } = res.data;
        const patch = aiFiltersToPatch(aiFilters);
        applyPatch(patch);

        setAiResult(
          BANNER_SOURCES.has(source)
            ? {
                source,
                query,
                summary: summarizeFilters(patch),
                unmapped: QUOTA_SOURCES.has(source) ? [] : unmapped || [],
                appliedSignature: filterSignature(patch),
              }
            : null // unavailable / fallback → silent plain search
        );
      } catch {
        if (requestId !== requestIdRef.current) return;
        applyPatch({ ...DEFAULT_FILTERS, search: query });
        setAiResult(null);
        setAiError("AI search is unavailable right now — showing plain results.");
      } finally {
        if (requestId === requestIdRef.current) setAiLoading(false);
      }
    },
    [applyPatch]
  );

  // The banner's escape hatch: re-run the original query as a plain-text search.
  const searchAsPlainText = useCallback(
    (query) => {
      applyPatch({ ...DEFAULT_FILTERS, search: query });
      setAiResult(null);
    },
    [applyPatch]
  );

  const dismissAiResult = useCallback(() => setAiResult(null), []);

  // The banner is anchored to the exact filter set it produced. Any manual filter
  // change (chip clear, sort, a new panel selection) moves the signature and the
  // banner clears itself — no need to wrap every page handler.
  useEffect(() => {
    if (aiResult && filterSignature(filters) !== aiResult.appliedSignature) {
      setAiResult(null);
    }
  }, [filters, aiResult]);

  return { aiResult, aiLoading, aiError, runAiSearch, searchAsPlainText, dismissAiResult };
}
