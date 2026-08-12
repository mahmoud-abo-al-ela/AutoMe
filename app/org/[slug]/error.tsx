"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">Something went wrong</h1>
        <p className="text-gray-500">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button onClick={() => reset()} variant="default" className="w-full sm:w-auto">
            Try again
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/">Go back home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
