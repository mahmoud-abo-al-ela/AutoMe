import { SignIn } from "@clerk/nextjs";

export default async function SignInPage({ searchParams }) {
  const params = await searchParams;
  const redirectUrl = params?.redirect_url || "/admin";

  return (
    <SignIn forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl} />
  );
}
