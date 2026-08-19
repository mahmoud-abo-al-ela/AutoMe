import { SignUp } from "@clerk/nextjs";
import { safeRedirectPath } from "@/lib/utils/safe-redirect";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const params = await searchParams;
  // See the sign-in page: this value decides where an authenticated user is
  // sent, so it must be proven internal before Clerk ever sees it.
  const redirectUrl = safeRedirectPath(params?.redirect_url);

  return (
    <SignUp forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl} />
  );
}
