"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Phone, Mail } from "lucide-react";

const DealerInfo = ({ dealer }) => {
  if (!dealer) return null;

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-lg">
            Dealer Information
          </h3>
          {dealer.verified && (
            <Badge
              variant="outline"
              className="text-green-700 border-green-200 bg-green-50"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified Dealer
            </Badge>
          )}
        </div>
        <div className="space-y-4">
          <div className="font-semibold text-gray-900 text-lg">
            {dealer.name}
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm bg-gray-50 p-3 rounded-lg">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{dealer.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm bg-gray-50 p-3 rounded-lg">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{dealer.email}</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full mt-4 rounded-xl hover:scale-105 transition-transform"
          >
            View All Cars from Dealer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DealerInfo;
