"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { getCarForEdit } from "@/actions/cars";
import CarFormShared from "../../_components/car-forms/shared/CarFormShared";
import { STATUS_DB_TO_FORM } from "@/lib/constants/car-options";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditCarPage() {
  const params = useParams();
  const router = useRouter();
  const carId = Array.isArray(params.carId) ? params.carId[0] : params.carId;

  const { data: car, isLoading, error } = useQuery({
    queryKey: queryKeys.cars.detail(carId ?? ""),
    queryFn: async () => {
      // `enabled` below keeps this from running without an id.
      const response = await getCarForEdit(carId!);
      if (!response?.success) {
        throw new Error(response?.error?.message || "Failed to fetch car data");
      }
      return response.data;
    },
    enabled: !!carId,
  });

  const goBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Car</h2>
        <p className="text-gray-600 mb-4">{error?.message || "Car not found or unauthorized access"}</p>
        <Button onClick={goBack}>Go Back</Button>
      </div>
    );
  }

  // Pre-process car data for the form
  const initialData = {
    ...car,
    status: STATUS_DB_TO_FORM[car.status] || "Available",
    // Ensure all numeric fields are actual numbers or empty strings
    year: car.year ? Number(car.year) : "",
    price: car.price ? Number(car.price) : "",
    mileage: car.mileage ? Number(car.mileage) : "",
    seats: car.seats ? Number(car.seats) : "",
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          className="hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Vehicle Details</h1>
      </div>

      <CarFormShared
        initialData={initialData}
        isEditMode={true}
        carId={carId}
      />
    </div>
  );
}
