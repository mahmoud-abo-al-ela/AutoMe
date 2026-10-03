"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Holds the hero photo a little behind the page: as you scroll, it drifts
 * down at a fraction of the speed, so the headline and search pass over it.
 * The frame is taller than the hero, so the drift never shows an edge; the
 * first frame has no offset, so the photo's first paint is never delayed.
 */
export function HeroParallax({ children }: { children: ReactNode }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 140]);

  return (
    <motion.div style={{ y }} className="absolute inset-x-0 -top-[8%] -z-40 h-[124%]">
      {children}
    </motion.div>
  );
}
