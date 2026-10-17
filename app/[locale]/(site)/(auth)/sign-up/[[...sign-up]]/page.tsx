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
