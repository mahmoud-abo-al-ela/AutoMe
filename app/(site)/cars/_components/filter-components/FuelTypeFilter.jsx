import React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FuelTypeFilter = ({
  selectedFuelTypes,
  availableFuelTypes,
  toggleFilter,
  setSelectedFuelTypes,
  isLoading,
}) => {
  return (
    <AccordionItem value="fuel" className="border-none">
      <AccordionTrigger className="py-2 hover:no-underline cursor-pointer">
        <span className="text-sm font-medium">Fuel Type</span>
        {selectedFuelTypes.length > 0 && (
          <Badge
            variant="secondary"
            className="ml-2 bg-primary/10 text-primary"
          >
            {selectedFuelTypes.length}
          </Badge>
        )}
      </AccordionTrigger>
      <AccordionContent>
        {availableFuelTypes.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1 pb-2">
            {availableFuelTypes.map((fuel) => (
              <Badge
                key={fuel}
                variant={
                  selectedFuelTypes.includes(fuel) ? "default" : "outline"
                }
                className={`${
                  selectedFuelTypes.includes(fuel)
                    ? ""
                    : "hover:bg-slate-100 cursor-pointer"
                } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                onClick={() =>
                  toggleFilter(fuel, selectedFuelTypes, setSelectedFuelTypes)
                }
              >
                {fuel}
                {selectedFuelTypes.includes(fuel) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-1">
            No fuel types available
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

export default FuelTypeFilter;
