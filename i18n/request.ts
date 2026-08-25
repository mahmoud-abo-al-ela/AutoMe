import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

/**
 * Message namespaces, mirroring the route structure.
 *
 * Listed explicitly rather than globbed because the bundler has to be able to
 * see each import statically — a dynamic directory read would defeat both
 * code-splitting and the build-time check that every namespace exists in every
 * locale. Adding a namespace means adding it here and creating the file in
 * *both* locales; a missing file is a build error, not a silent English
 * fallback, which is the behaviour we want.
 */
const NAMESPACES = ["common", "nav", "footer", "home", "carAttributes"] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
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
