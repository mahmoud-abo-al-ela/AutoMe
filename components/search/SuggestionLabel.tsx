import { highlightRanges, splitByRanges } from "@/lib/search/highlight";

/**
 * A suggestion's label as the big stores show it: what the buyer typed in
 * plain weight, and what the suggestion adds to it in bold — "toy" → toy**ota**.
 * "Typed" is decided as the search decides a match (lib/search/highlight.ts):
 * folded ("هيونداى" is typed in "هيونداي"), at the start of a word, so typed
 * letters inside a word stay part of the completion.
 *
 * Text nodes only, never HTML; wrapped in <bdi> so a Latin model beside an
 * Arabic word keeps its own direction. Nothing typed: the label as it is.
 */
export function SuggestionLabel({ label, query }: { label: string; query: string }) {
  if (!query.trim()) return <bdi>{label}</bdi>;
  return (
    <bdi>
      {splitByRanges(label, highlightRanges(label, [query])).map((part, i) =>
        part.marked ? (
          <span key={i}>{part.text}</span>
        ) : (
          <strong key={i} className="font-semibold">
            {part.text}
          </strong>
        )
      )}
    </bdi>
  );
}
