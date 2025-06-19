"use client";

import { Button } from "@/components/ui/button";
import { HomeIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";

const NotFound = () => {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center  p-6">
      <div className="w-full max-w-3xl">
        {/* Image section */}
        <div className=" h-full min-h-[200px] flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-300 mb-2">
            404
          </h1>
          <div className="h-2 w-24 bg-gray-300/50 mx-auto rounded-full mb-4"></div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary">
              Page Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't find the page you were looking for doesn't exist on
              our site.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 cursor-pointer"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button className="flex-1 cursor-pointer" asChild>
                <Link href="/">
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
