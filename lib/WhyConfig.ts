/**
 * "Why choose us" cards.
 *
 * Cards carry message keys into the `home.why.cards` namespace rather than
 * English copy, for the same reason as HeaderConfig: a config file full of
 * prose is invisible to the string sweep and cannot be translated.
 */

export type WhyCardKey =
  | "insights"
  | "secure"
  | "support"
  | "tours"
  | "compare"
  | "financing";

export const whyConfig: Array<{ icon: string; key: WhyCardKey }> = [
  { icon: "Zap", key: "insights" },
  { icon: "Shield", key: "secure" },
  { icon: "Clock", key: "support" },
  { icon: "Zap", key: "tours" },
  { icon: "Shield", key: "compare" },
  { icon: "Clock", key: "financing" },
];
