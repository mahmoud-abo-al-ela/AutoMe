import { SignIn } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import { safeRedirectPath } from "@/lib/utils/safe-redirect";
import { AuthShell } from "../../_components/AuthShell";
import { clerkAppearance } from "../../_lib/clerk-appearance";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.signIn.meta" });
  return { title: t("title") };
}

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

  const query = await searchParams;
  const redirectUrl = safeRedirectPath(query?.redirect_url, `/${locale}`);
  const returnQuery = `?redirect_url=${encodeURIComponent(redirectUrl)}`;

  return (
    <AuthShell mode="signIn">
      <SignIn
        appearance={clerkAppearance}
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={redirectUrl}
        // A sign-in can finish as a sign-up — "Continue with Google" for an
        // address with no account does. That leg reads these instead, and with
        // them unset Clerk sent the new user to "/", which resolves to /en.
        signUpForceRedirectUrl={redirectUrl}
        signUpFallbackRedirectUrl={redirectUrl}
        // The card footer links to sign-up. Left to itself Clerk builds that from
        // NEXT_PUBLIC_CLERK_SIGN_UP_URL ("/sign-up"), which has no locale, so an
        // Arabic reader following it was dropped into English. It also carries
        // the return path, or switching cards forgets where the reader came from.
        signUpUrl={`/${locale}/sign-up${returnQuery}`}
      />
    </AuthShell>
  );
}
