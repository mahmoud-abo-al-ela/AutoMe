import { SignUp } from "@clerk/nextjs";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const params = await searchParams;
  const redirectUrl = params?.redirect_url;

  return (
    <SignUp forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl} />
  );
}
