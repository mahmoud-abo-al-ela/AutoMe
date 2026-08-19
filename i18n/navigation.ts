import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware replacements for next/link and next/navigation.
 *
 * Import `Link`, `useRouter`, `redirect` and friends from here rather than from
 * `next/*` in any component under `app/[locale]`. These keep the active locale
 * prefix on the URL; the plain Next versions drop it, which silently bounces an
 * Arabic user back to the English tree on the first navigation.
 *
 * `useSearchParams`, `useParams` and `notFound` have no locale dimension and
 * still come from `next/navigation`.
 */
const navigation = createNavigation(routing);

export const { Link, usePathname, useRouter, getPathname } = navigation;

/**
 * Re-exported with an explicit type annotation, which is load-bearing.
 *
 * TypeScript only treats a call as never-returning — and therefore only narrows
 * the code after it — when the callee is an identifier with an explicitly
 * declared type. A destructured binding does not qualify, so exporting
 * `redirect` alongside the others above silently stopped `redirect()` from
 * terminating control flow: every `if (!user) redirect(...)` guard left `user`
 * as possibly-null for the rest of the function.
 */
export const redirect: typeof navigation.redirect = navigation.redirect;
export const permanentRedirect: typeof navigation.permanentRedirect =
  navigation.permanentRedirect;
