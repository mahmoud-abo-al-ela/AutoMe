"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 140, damping: 20 } },
};

/**
 * Rises into view once, as it scrolls in. Children marked RevealItem follow
 * one after another (staggered); anything else rises with the container.
 * Transform and opacity only, so it stays on the GPU.
 */
export function Reveal({
  children,
  as = "div",
  className,
  amount = 0.15,
}: {
  children: ReactNode;
  as?: "div" | "ul";
  className?: string;
  /** How much of the block must be on screen before it plays. */
  amount?: number;
}) {
  const Component = as === "ul" ? motion.ul : motion.div;
  return (
    <Component
      className={className}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
    >
      {children}
    </Component>
  );
}

/** One staggered step inside a Reveal. */
export function RevealItem({
  children,
  as = "div",
  className,
}: {
  children: ReactNode;
  as?: "div" | "li";
  className?: string;
}) {
  const Component = as === "li" ? motion.li : motion.div;
  return (
    <Component className={className} variants={item}>
      {children}
    </Component>
  );
}

/** A whole block rising in on its own (a section with no staggered parts). */
export function RevealBlock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: "spring", stiffness: 110, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
