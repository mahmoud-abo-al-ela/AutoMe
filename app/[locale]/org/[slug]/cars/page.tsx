
import React from "react";
import type { Metadata } from "next";
import CarsList from "./_components/car-list/CarsList";
import { CarsPlanBanner } from "./_components/cars-plan-banner";

export const metadata: Metadata = {
  title: "Cars",
  description: "Manage your cars",
};

const CarsPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  return (
    <div>
      <CarsPlanBanner orgSlug={slug} />
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Car Management
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Manage your car listings and inventory
            </p>
          </div>
        </div>
      </div>
      <CarsList />
    </div>
  );
};

export default CarsPage;
