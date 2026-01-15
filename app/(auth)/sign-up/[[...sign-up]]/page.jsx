import { SignUp } from "@clerk/nextjs";

export default async function SignUpPage({ searchParams }) {
  const params = await searchParams;
  const redirectUrl = params?.redirect_url || "/admin";
  
  return (
    <SignUp
      forceRedirectUrl={redirectUrl}
      fallbackRedirectUrl={redirectUrl}
    />
  );
}
