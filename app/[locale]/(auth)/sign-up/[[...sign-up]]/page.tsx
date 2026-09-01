import { setRequestLocale } from "next-intl/server";
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
  setRequestLocale(locale);

  const query = await searchParams;
  // See the sign-in page: this value decides where an authenticated user is
  // sent, so it must be proven internal before Clerk ever sees it.
  const redirectUrl = safeRedirectPath(query?.redirect_url);

  return (
    <SignUp forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl} />
  );
}
