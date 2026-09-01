/**
 * A clock-time range, isolated to left-to-right.
 *
 * "09:00 - 17:00" is two left-to-right runs joined by a neutral hyphen. Dropped
 * straight into Arabic text, the bidi algorithm reorders them and the range
 * renders end-first — so a slot reads as though it finishes before it starts.
 * The `dir` attribute isolates the whole range, which is correct rather than a
 * workaround: these are always Western digits in a fixed HH:mm format, and a
 * time range reads start-to-end in both scripts.
 */
export const TimeRange = ({ start, end }: { start: string; end: string }) => (
  <span dir="ltr">
    {start} – {end}
  </span>
);

export default TimeRange;
