"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** How often, and how many times, the page asks again before it stops. */
const INTERVAL_MS = 3_000;
const MAX_ATTEMPTS = 20;

/**
 * Shown while Paymob has not confirmed a payment yet. Re-renders the server
 * page every few seconds; the page itself asks Paymob and swaps this out once
 * the payment is paid or declined. After about a minute it stops and lets the
 * buyer check again by hand.
 */
export function PaymentConfirming({
  title,
  body,
  slowBody,
  checkAgain,
}: {
  title: string;
  body: string;
  slowBody: string;
  checkAgain: string;
}) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);
  const waiting = attempts < MAX_ATTEMPTS;

  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => {
      setAttempts((n) => n + 1);
      router.refresh();
    }, INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [attempts, waiting, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4" aria-live="polite">
          {waiting && <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" aria-hidden />}
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-muted-foreground text-sm">{waiting ? body : slowBody}</p>
          {!waiting && (
            <Button
              type="button"
              className="cursor-pointer"
              onClick={() => {
                setAttempts(0);
                router.refresh();
              }}
            >
              {checkAgain}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
