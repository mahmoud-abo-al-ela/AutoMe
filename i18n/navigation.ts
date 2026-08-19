import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware replacements for next/link and next/navigation.
 *
 * Import `Link`, `useRouter`, `redirect` and friends from here rather than from
 * `next/*` in any component under `app/[locale]`. These keep the active locale
 * prefix on the URL; the plain Next versions drop it, which silently bounces an
 * Arabic user back to the English tree on the first navigation.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
