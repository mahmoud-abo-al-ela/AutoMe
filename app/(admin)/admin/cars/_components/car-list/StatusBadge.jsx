import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";

const StatusBadge = ({ status, compact = false, iconOnly = false }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "available":
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: "Available",
          className: "text-green-600 bg-green-50 border-green-200",
        };
      case "sold":
        return {
          icon: <XCircle className="h-3 w-3" />,
          text: "Sold",
          className: "text-red-600 bg-red-50 border-red-200",
        };
      case "unavailable":
        return {
          icon: <Clock className="h-3 w-3" />,
          text: "Unavailable",
          className: "text-orange-600 bg-orange-50 border-orange-200",
        };
      default:
        return {
          icon: <Clock className="h-3 w-3" />,
          text: "Unknown",
          className: "text-gray-600 bg-gray-50 border-gray-200",
        };
    }
  };

  const { icon, text, className } = getStatusConfig();

  return (
    <Badge
      variant="outline"
      className={`text-xs whitespace-nowrap ${className} ${
        iconOnly ? "h-6 w-6 p-0 flex items-center justify-center" : ""
      }`}
    >
      <span className={compact || iconOnly ? "" : "mr-1"}>{icon}</span>
      {!compact && !iconOnly && text}
    </Badge>
  );
};

export default StatusBadge;
