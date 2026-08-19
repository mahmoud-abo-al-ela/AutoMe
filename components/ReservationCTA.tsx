"use client";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarDays, Clock, ArrowRight } from "lucide-react";

const ReservationCTA = () => {
  const router = useRouter();

  const navigateToReservation = () => {
    router.push("/cars");
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-r from-primary/5 to-brand-accent/5">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium bg-card">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 inline-flex items-center justify-center text-xs mr-2">
                <CalendarDays size={12} />
              </span>
              <span>Easy Scheduling</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              Schedule Your Test Drive Online
            </h2>
            <p className="text-lg text-muted-foreground max-w-[600px]">
              Skip the wait and book your test drive appointment in minutes.
              Choose your preferred date and time, and we&apos;ll have the car
              ready for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
                onClick={navigateToReservation}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8"
              >
                Find a Car
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-card p-6 shadow-md border-0 rounded-xl hover:shadow-lg transition-shadow duration-300">
              <div className="bg-primary/10 rounded-full h-12 w-12 flex items-center justify-center mb-4">
                <CalendarDays className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Easy Scheduling</h3>
              <p className="text-muted-foreground">
                Choose from available dates and times that work best for your
                schedule.
              </p>
            </Card>
            <Card className="bg-card p-6 shadow-md border-0 rounded-xl hover:shadow-lg transition-shadow duration-300">
              <div className="bg-brand-accent/10 rounded-full h-12 w-12 flex items-center justify-center mb-4">
                <Clock className="text-brand-accent h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Wait Times</h3>
              <p className="text-muted-foreground">
                Your car will be ready when you arrive. No unnecessary waiting.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReservationCTA;
