"use client";

import { OAuthConsent, RedirectToSignIn, useAuth } from "@clerk/nextjs";

export default function ConsentCard() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;
  return <OAuthConsent />;
}
