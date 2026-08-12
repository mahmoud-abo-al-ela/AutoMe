import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";

function CTA() {
  return (
    <section className="py-10 sm:py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
            Ready to find your perfect car?
          </h2>
          <p className="text-base sm:text-lg text-primary-foreground/80 mb-6 sm:mb-8 max-w-3xl mx-auto px-2 sm:px-0">
            Let&apos;s Discover Your Dream Car, and Make Your Driving Experience
            Unforgettable!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto"
            >
              <Link href="/cars">Browse All Vehicles</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;
