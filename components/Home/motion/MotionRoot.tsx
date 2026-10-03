"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * The home page's motion settings. `reducedMotion="user"` turns every
 * transform animation inside it off for people who ask their system for less
 * motion — the CSS half of the page's motion honours the same media query.
 */
export function MotionRoot({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
