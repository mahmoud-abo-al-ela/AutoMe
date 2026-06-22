"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Clock, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

const InfoSidebar = ({ car, carId }) => {
  const [carData, setCarData] = useState(car || null);

  const { data } = useQuery({
    queryKey: queryKeys.cars.detail(carId),
    queryFn: async () => {
      const response = await fetch(`/api/cars/${carId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch car data");
      }
      return await response.json();
    },
    enabled: Boolean(carId && !car),
  });

  useEffect(() => {
    if (data?.success) {
      setCarData(data.data);
    }
  }, [data]);

  return (
    <Card className="p-4 md:p-6 mx-2 md:mx-0 gap-3">
      <h3 className="text-lg font-semibold mb-2 md:mb-4">
        Important Information
      </h3>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center">
          <span className="bg-primary/10 text-primary rounded-full p-1 mr-2 mt-0.5">
            <CalendarDays className="h-6 w-6" />
          </span>
          <span>Test drives are subject to availability</span>
        </li>
        <li className="flex items-center">
          <span className="bg-primary/10 text-primary rounded-full p-1 mr-2 mt-0.5">
            <Clock className="h-6 w-6" />
          </span>
          <span>Please arrive 10 minutes before your scheduled time</span>
        </li>
        <li className="flex items-center">
          <span className="bg-primary/10 text-primary rounded-full p-1 mr-2 mt-0.5">
            <Info className="h-6 w-6" />
          </span>
          <span>Bring your driver's license and proof of insurance</span>
        </li>
      </ul>
      <Separator className="my-4" />
      <div className="text-sm text-muted-foreground">
        <p>
          Our staff will confirm your test drive appointment within 24 hours.
        </p>
      </div>
    </Card>
  );
};

export default InfoSidebar;
