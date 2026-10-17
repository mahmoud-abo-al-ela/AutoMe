import { revalidatePath } from "next/cache";
import { routing } from "@/i18n/routing";

export function revalidateLocalized(path: string): void {
  for (const locale of routing.locales) {
    revalidatePath(path === "/" ? `/${locale}` : `/${locale}${path}`);
  }
}

export function revalidateRouteTree(route: `/[locale]${string}`): void {
  revalidatePath(route, "layout");
}
