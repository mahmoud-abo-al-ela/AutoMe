import React from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FieldInfo = ({ text }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 cursor-help ml-1" />
      </TooltipTrigger>
      <TooltipContent className="max-w-[200px] sm:max-w-xs text-xs sm:text-sm">
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default FieldInfo;
