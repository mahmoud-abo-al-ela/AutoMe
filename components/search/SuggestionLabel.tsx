import { highlightRanges, splitByRanges } from "@/lib/search/highlight";

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
