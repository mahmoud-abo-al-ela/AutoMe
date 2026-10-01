import { cookies, headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { localeLabels, type Locale } from "@/i18n/routing";
import {
  LOCALE_CHOICE_COOKIE,
  localeToSuggest,
} from "@/lib/utils/locale-suggestion";
import LocaleSuggestionBanner from "./components/LocaleSuggestionBanner";

/**
 * Offers the page in the browser's language when that differs from the URL's.
 *
 * Rendered on the server so the bar is in the first paint: added after
 * hydration, it would either shove the page down or flash in over it. The
 * site layout already renders per request (it reads the session), so reading
 * Accept-Language here costs no caching.
 *
 * The copy is in the *suggested* language, not the page's — the reader it is
 * for is precisely the one who may not read the page's. Language names stay
 * in their own script either way (`localeLabels`).
 */
export default async function LocaleSuggestion({ locale }: { locale: Locale }) {
  const [requestHeaders, requestCookies] = await Promise.all([
    headers(),
    cookies(),
  ]);

  const suggested = localeToSuggest(
    locale,
    requestHeaders.get("accept-language"),
    requestCookies.get(LOCALE_CHOICE_COOKIE)?.value
  );
  if (!suggested) return null;

  const t = await getTranslations({
    locale: suggested,
    namespace: "common.language",
  });

  return (
    <LocaleSuggestionBanner
      current={locale}
      suggested={suggested}
      body={t("suggestionBody", { language: localeLabels[suggested] })}
      acceptLabel={t("suggestionAccept", { language: localeLabels[suggested] })}
      dismissLabel={t("suggestionDismiss", { language: localeLabels[locale] })}
    />
  );
}
