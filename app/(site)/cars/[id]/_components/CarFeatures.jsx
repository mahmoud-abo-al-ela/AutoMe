"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Award, CheckCircle } from "lucide-react";

const CarFeatures = ({ features }) => {
  if (!features || features.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg border-0 bg-white p-0">
      <CardContent className="p-4 sm:p-6 md:p-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
          <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
          </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
            Features & Equipment
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-gray-50 to-blue-50 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl hover:shadow-md transition-all duration-200 group"
            >
              <div className="p-1 sm:p-1.5 bg-green-100 rounded-md sm:rounded-lg group-hover:bg-green-200 transition-colors">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              </div>
              <span className="font-medium text-gray-800 text-xs sm:text-sm md:text-base truncate">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CarFeatures;
