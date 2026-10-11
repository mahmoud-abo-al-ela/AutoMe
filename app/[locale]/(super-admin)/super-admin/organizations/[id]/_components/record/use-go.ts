import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";

/** Moves the page to another URL inside a transition, so the content dims rather than blanks. */
export function useGo() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return {
    pending,
    go: (href: string) =>
      startTransition(() => router.replace(href, { scroll: false })),
  };
}
