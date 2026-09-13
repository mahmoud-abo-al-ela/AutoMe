import * as rootParams from "next/root-params";
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
const NAMESPACES = [
  "common",
  "nav",
  "footer",
  "home",
  "carAttributes",
  "cars",
  "carDetail",
  "testDrive",
  "errors",
  "contact",
  "wishlist",
  "compare",
  "legal",
  "about",
] as const;

export default getRequestConfig(async ({ locale: explicitLocale }) => {
  const requested = explicitLocale ?? (await rootParams.locale());

  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const loaded = await Promise.all(
    NAMESPACES.map(
      (ns) =>
        import(`../messages/${locale}/${ns}.json`) as Promise<{
          default: Record<string, unknown>;
        }>
    )
  );

  const messages = Object.fromEntries(
    NAMESPACES.map((ns, i) => [ns, loaded[i].default])
  );

  return {
    locale,
    messages,
    // Egypt is a single timezone, but it observes DST (reinstated 2023), so
    // this is a named zone rather than a fixed offset — see lib/utils/datetime.
    timeZone: "Africa/Cairo",
    now: new Date(),
  };
});
