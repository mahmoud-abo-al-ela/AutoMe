import React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TransmissionFilter = ({
  selectedTransmissions,
  availableTransmissions,
  toggleFilter,
  setSelectedTransmissions,
  isLoading,
}) => {
  return (
    <AccordionItem value="transmission" className="border-none">
      <AccordionTrigger className="py-2 hover:no-underline cursor-pointer">
        <span className="text-sm font-medium">Transmission</span>
        {selectedTransmissions.length > 0 && (
          <Badge
            variant="secondary"
            className="ml-2 bg-primary/10 text-primary"
          >
            {selectedTransmissions.length}
          </Badge>
        )}
      </AccordionTrigger>
      <AccordionContent>
        {availableTransmissions.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1 pb-2">
            {availableTransmissions.map((trans) => (
              <Badge
                key={trans}
                variant={
                  selectedTransmissions.includes(trans) ? "default" : "outline"
                }
                className={`${
                  selectedTransmissions.includes(trans)
                    ? ""
                    : "hover:bg-slate-100 cursor-pointer"
                } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                onClick={() =>
                  toggleFilter(
                    trans,
                    selectedTransmissions,
                    setSelectedTransmissions
                  )
                }
              >
                {trans}
                {selectedTransmissions.includes(trans) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-1">
            No transmissions available
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

export default TransmissionFilter;
