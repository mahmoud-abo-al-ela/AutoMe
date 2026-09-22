import { SignUp } from "@clerk/nextjs";
import { safeRedirectPath } from "@/lib/utils/safe-redirect";

export default async function SignUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  // See the contact page: without this the surrounding layout renders in the
  // default locale, which is what left the footer English on /ar.
  const { locale } = await params;

  const query = await searchParams;
  // See the sign-in page: this value decides where an authenticated user is
  // sent, so it must be proven internal before Clerk ever sees it.
  // The fallback has to carry the locale. DEFAULT_REDIRECT is "/", which has
  // no prefix, and `localePrefix: "always"` with detection off resolves that
  // to the default locale — so signing in on /ar with no return path landed
  // the reader on /en.
  const redirectUrl = safeRedirectPath(query?.redirect_url, `/${locale}`);

  return (
    <SignUp
      forceRedirectUrl={redirectUrl}
      fallbackRedirectUrl={redirectUrl}
      // See the sign-in page: the footer link back to sign-in needs the locale.
      signInUrl={`/${locale}/sign-in`}
    />
  );
}
