import { revalidatePath } from "next/cache";
import { routing } from "@/i18n/routing";

/**
 * Locale-aware wrappers around `revalidatePath`. Actions call these, never
 * `revalidatePath` directly — lib/utils/revalidate.test.ts enforces it.
 *
 * Every page URL carries a locale prefix, and Next tags a rendered page with
 * two things: its concrete URL ("/en/cars") and each folder of its route file
 * path, route groups included ("/[locale]/(site)/cars/layout"). An unprefixed
 * "/cars" matches neither, which is how every call in actions/ silently
 * stopped refreshing anything when the locale prefix arrived.
 */

/**
 * Refresh one page in every locale: "/cars" → "/en/cars" and "/ar/cars".
 * Query strings are not part of a page's cache identity, so "/test-drive"
 * covers "/test-drive?carId=…" as well.
 */
export function revalidateLocalized(path: string): void {
  for (const locale of routing.locales) {
    revalidatePath(path === "/" ? `/${locale}` : `/${locale}${path}`);
  }
}

/**
 * Refresh every page under one folder of the route tree, in every locale and
 * for every value of its dynamic segments — for when the action does not
 * have the slug or id that would name a single URL.
 *
 * `route` is the folder as it sits under app/, route groups included, e.g.
 * "/[locale]/(site)/cars". The test checks each one exists, because a folder
 * renamed or regrouped makes this match nothing, without an error.
 */
export function revalidateRouteTree(route: `/[locale]${string}`): void {
  revalidatePath(route, "layout");
}
