import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";

function CTA() {
  return (
    <section className="py-16 bg-[#1A1F2C] text-white">
      <div className="container mx-auto">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to find your perfect car?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-3xl mx-auto">
            Let's Discover Your Dream Car, and Make Your Driving Experience
            Unforgettable!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-[#0532a3] hover:bg-[#0532a3]/90"
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
