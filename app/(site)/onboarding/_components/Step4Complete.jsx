"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

export default function Step4Complete({ createdOrg }) {
  useEffect(() => {
    // Fire confetti on mount
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const adminUrl = createdOrg
    ? `http://${createdOrg.slug}.localhost:3000/admin`
    : "#";

  const siteUrl = createdOrg ? `http://${createdOrg.slug}.localhost:3000` : "#";

  return (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">🎉 Your Dealership is Ready!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Congratulations! <strong>{createdOrg?.name}</strong> has been created
          successfully. You can now start adding cars and managing your
          dealership.
        </p>
      </div>

      <div className="bg-muted p-4 rounded-lg max-w-md mx-auto">
        <p className="text-sm text-muted-foreground mb-2">
          Your dealership URL:
        </p>
        <a
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-primary hover:underline flex items-center justify-center gap-1"
        >
          {createdOrg?.slug}.localhost:3000
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Button variant="outline" asChild>
          <a href={siteUrl} target="_blank" rel="noopener noreferrer">
            View Your Site
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        </Button>
        <Button asChild>
          <a href={adminUrl}>
            Go to Admin Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </a>
        </Button>
      </div>

      <div className="pt-6 border-t mt-8">
        <h3 className="font-medium mb-3">What's Next?</h3>
        <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-sm mx-auto">
          <li className="flex items-start gap-2">
            <span className="text-primary">1.</span>
            Add your first car to the inventory
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">2.</span>
            Invite team members to help manage your dealership
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">3.</span>
            Customize your dealership settings
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">4.</span>
            Start receiving test drive bookings!
          </li>
        </ul>
      </div>
    </div>
  );
}
