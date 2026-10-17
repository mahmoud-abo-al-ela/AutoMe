"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import type { ReactNode } from "react";

export function HeroParallax({ children }: { children: ReactNode }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 140]);

  return (
    <motion.div style={{ y }} className="absolute inset-x-0 -top-[8%] -z-40 h-[124%]">
      {children}
    </motion.div>
  );
}
