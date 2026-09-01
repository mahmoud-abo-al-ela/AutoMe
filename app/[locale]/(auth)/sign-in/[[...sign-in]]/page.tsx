import { setRequestLocale } from "next-intl/server";
import { SignIn } from "@clerk/nextjs";
import { safeRedirectPath } from "@/lib/utils/safe-redirect";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  // See the contact page: without this the surrounding layout renders in the
  // default locale, which is what left the footer English on /ar.
  const { locale } = await params;
  setRequestLocale(locale);

  const query = await searchParams;
  // Never pass the raw query value to Clerk: it decides where the user lands
  // once authenticated, so an unvalidated absolute URL here is an open redirect.
  const redirectUrl = safeRedirectPath(query?.redirect_url);

  return (
    <SignIn
      forceRedirectUrl={redirectUrl}
      fallbackRedirectUrl={redirectUrl}
      // The card footer links to sign-up. Left to itself Clerk builds that from
      // NEXT_PUBLIC_CLERK_SIGN_UP_URL ("/sign-up"), which has no locale, so an
      // Arabic reader following it was dropped into English.
      signUpUrl={`/${locale}/sign-up`}
    />
  );
}
