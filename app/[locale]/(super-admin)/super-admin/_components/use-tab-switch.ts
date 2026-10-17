"use client";

import { useState, useTransition, type MouseEvent } from "react";
import { useRouter } from "@/i18n/navigation";

export function useTabSwitch<T extends string>(current: T) {
  const router = useRouter();
  const [loading, startTransition] = useTransition();
  const [target, setTarget] = useState<T>(current);

  const open = (tab: T, href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (tab === current && !loading) return;
    setTarget(tab);
    startTransition(() => router.push(href, { scroll: false }));
  };

  return { shown: loading ? target : current, loading, open };
}
