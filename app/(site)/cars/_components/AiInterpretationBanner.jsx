"use client";

import { Sparkles, Clock, X } from "lucide-react";
import { motion } from "framer-motion";

const QUOTA_COPY = {
  quota_daily: {
    lead: "AI search has hit today’s free limit",
    tail: "It resets at midnight UTC.",
  },
  quota_minute: {
    lead: "AI search is busy",
    tail: "Try again in a minute.",
  },
};

// The honesty surface for AI search: it states the interpretation, lists what was
// dropped, says when AI wasn't used (and why), and offers a one-click escape to a
// plain-text search. Clearing on a manual filter change is owned by useAiSearch.
export const AiInterpretationBanner = ({ result, onSearchPlainText, onDismiss }) => {
  if (!result) return null;

  const { source, query, summary, unmapped = [] } = result;
  const quota = QUOTA_COPY[source];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        quota
          ? "border-border bg-muted text-muted-foreground"
          : "border-primary/20 bg-primary/5 text-foreground"
      }`}
    >
      {quota ? (
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      )}

      <div className="min-w-0 flex-1">
        {quota ? (
          <p>
            {quota.lead} — showing plain text results for{" "}
            <span className="font-semibold text-foreground">“{query}”</span>. {quota.tail}
          </p>
        ) : (
          <p>
            Showing{" "}
            <span className="font-semibold">{summary || `“${query}”`}</span>
            {unmapped.length > 0 && (
              <span className="text-muted-foreground">
                {" "}· Ignored:{" "}
                <span className="italic">{unmapped.map((w) => `“${w}”`).join(", ")}</span>
              </span>
            )}
          </p>
        )}

        {!quota && (
          <button
            type="button"
            onClick={() => onSearchPlainText(query)}
            className="mt-1 text-xs font-medium text-primary underline-offset-2 transition-colors hover:underline"
          >
            Not what you meant? Search as plain text
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss AI interpretation"
        className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export default AiInterpretationBanner;
