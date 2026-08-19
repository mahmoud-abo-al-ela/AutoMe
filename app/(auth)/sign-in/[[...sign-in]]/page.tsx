import { SignIn } from "@clerk/nextjs";
import { safeRedirectPath } from "@/lib/utils/safe-redirect";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const params = await searchParams;
  // Never pass the raw query value to Clerk: it decides where the user lands
  // once authenticated, so an unvalidated absolute URL here is an open redirect.
  const redirectUrl = safeRedirectPath(params?.redirect_url);

  return (
    <SignIn forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl} />
  );
}
