import { SignUp } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import { safeRedirectPath } from "@/lib/utils/safe-redirect";
import { AuthShell } from "../../_components/AuthShell";
import { clerkAppearance } from "../../_lib/clerk-appearance";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.signUp.meta" });
  return { title: t("title") };
}

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
  const returnQuery = `?redirect_url=${encodeURIComponent(redirectUrl)}`;

  return (
    <AuthShell mode="signUp">
      <SignUp
        appearance={clerkAppearance}
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={redirectUrl}
        // See the sign-in page: the reverse transfer — signing up with an
        // address that already has an account — finishes as a sign-in.
        signInForceRedirectUrl={redirectUrl}
        signInFallbackRedirectUrl={redirectUrl}
        // See the sign-in page: the footer link back to sign-in needs the locale
        // and the return path.
        signInUrl={`/${locale}/sign-in${returnQuery}`}
      />
    </AuthShell>
  );
}
