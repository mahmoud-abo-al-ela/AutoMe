import React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const MakesFilter = ({
  selectedMakes,
  availableMakes,
  toggleFilter,
  setSelectedMakes,
  isLoading,
}) => {
  return (
    <AccordionItem value="makes" className="border-none">
      <AccordionTrigger className="py-2 hover:no-underline cursor-pointer">
        <span className="text-sm font-medium">Makes</span>
        {selectedMakes.length > 0 && (
          <Badge
            variant="secondary"
            className="ml-2 bg-primary/10 text-primary"
          >
            {selectedMakes.length}
          </Badge>
        )}
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-wrap gap-2 pt-1 pb-2">
          {availableMakes.slice(0, 12).map((make) => (
            <Badge
              key={make}
              variant={selectedMakes.includes(make) ? "default" : "outline"}
              className={`${
                selectedMakes.includes(make)
                  ? ""
                  : "hover:bg-slate-100 cursor-pointer"
              } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() =>
                toggleFilter(make, selectedMakes, setSelectedMakes)
              }
            >
              {make}
              {selectedMakes.includes(make) && <X className="ml-1 h-3 w-3" />}
            </Badge>
          ))}
          {availableMakes.length > 12 && (
            <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
              +{availableMakes.length - 12} more
            </Button>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default MakesFilter;
