"use client";

import { useFormatters } from "@/hooks/use-formatters";

export const TimeRange = ({ start, end }: { start: string; end: string }) => {
  const { clockTime } = useFormatters();

  return (
    <span dir="auto">
      {clockTime(start)} – {clockTime(end)}
    </span>
  );
};

export default TimeRange;
