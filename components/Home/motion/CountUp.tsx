"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * A live number that counts up the first time it scrolls into view.
 *
 * The server renders the real value, so the page is right without JavaScript
 * and for crawlers. On hydration, a number already on screen keeps its value
 * (resetting it would visibly flash); one below the fold drops to zero out of
 * sight, then counts up as it arrives. Reduced motion: the value, unmoving.
 */
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const [armed, setArmed] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    const rect = el.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) {
      setShown(0);
      setArmed(true);
    }
  }, [reduce]);

  useEffect(() => {
    if (!armed || !inView) return;
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [armed, inView, value]);

  return <span ref={ref}>{format(shown)}</span>;
}
