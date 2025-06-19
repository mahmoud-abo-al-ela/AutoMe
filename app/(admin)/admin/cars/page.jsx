import React from "react";
import { CarsList } from "./_components/car-list";

export const metadata = {
  title: "Cars | AutoMe Admin",
  description: "Manage your cars",
};

const CarsPage = () => {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Car Management
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
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
