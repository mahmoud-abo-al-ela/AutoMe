"use client";

import { OAuthConsent, RedirectToSignIn, useAuth } from "@clerk/nextjs";

/**
 * Clerk's prebuilt consent card: it reads the authorization request from the
 * URL, shows the app and the access it asks for, and sends the person's
 * decision to Clerk. Mounted only once Clerk has loaded — reached straight
 * from sign-in, the user can be briefly unset and the card would render
 * nothing (clerk/javascript#9659). Signed out, the person signs in first and
 * comes back here with the same request.
 */
export default function ConsentCard() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;
  return <OAuthConsent />;
}
