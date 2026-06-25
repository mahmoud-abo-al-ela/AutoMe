"use client";

import { MapPin, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const CityFilter = ({ selectedCity, availableCities, onSelect, isLoading }) => {
  if (!availableCities || availableCities.length === 0) return null;

  return (
    <AccordionItem value="city" className="border-none">
      <AccordionTrigger className="py-1.5 sm:py-2 hover:no-underline cursor-pointer">
        <span className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
          <MapPin className="h-3.5 w-3.5 text-cyan-500" />
          Location
        </span>
        {selectedCity && (
          <Badge variant="secondary" className="ml-1.5 sm:ml-2 bg-primary/10 text-primary text-xs">
            1
          </Badge>
        )}
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-wrap gap-1 sm:gap-2 pt-1 pb-2">
          {availableCities.map((city) => {
            const isSelected = selectedCity === city;
            return (
              <Badge
                key={city}
                variant="outline"
                className={`transition-all duration-200 hover:scale-105 active:scale-95 ${
                  isSelected
                    ? "bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200"
                    : "hover:bg-slate-100 cursor-pointer"
                } ${isLoading ? "opacity-50 pointer-events-none" : ""} text-xs py-0.5 px-1.5 sm:px-2 cursor-pointer`}
                onClick={() => onSelect(isSelected ? undefined : city)}
              >
                {city}
                {isSelected && <X className="ml-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />}
              </Badge>
            );
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default CityFilter;
