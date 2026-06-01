import React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const BodyTypeFilter = ({
  selectedBodyTypes,
  availableBodyTypes,
  toggleFilter,
  setSelectedBodyTypes,
  isLoading,
}) => {
  return (
    <AccordionItem value="body" className="border-none">
      <AccordionTrigger className="py-2 hover:no-underline cursor-pointer">
        <span className="text-sm font-medium">Body Type</span>
        {selectedBodyTypes.length > 0 && (
          <Badge
            variant="secondary"
            className="ml-2 bg-primary/10 text-primary"
          >
            {selectedBodyTypes.length}
          </Badge>
        )}
      </AccordionTrigger>
      <AccordionContent>
        {availableBodyTypes.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1 pb-2">
            {availableBodyTypes.map((type) => (
              <Badge
                key={type}
                variant="outline"
                className={`transition-all duration-200 hover:scale-105 active:scale-95 ${
                  selectedBodyTypes.includes(type)
                    ? "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200"
                    : "hover:bg-slate-100 cursor-pointer"
                } ${isLoading ? "opacity-50 pointer-events-none" : ""} cursor-pointer`}
                onClick={() =>
                  toggleFilter(type, selectedBodyTypes, setSelectedBodyTypes)
                }
              >
                {type}
                {selectedBodyTypes.includes(type) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-1">
            No body types available
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

export default BodyTypeFilter;
