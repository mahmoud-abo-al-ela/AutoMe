import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const SharedSettingCard = ({ settingsPages }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {settingsPages.map((page) => (
        <Card key={page.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 sm:pb-4">
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${page.color} flex items-center justify-center mb-2 sm:mb-3`}
            >
              <page.icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <CardTitle className="text-base sm:text-lg">{page.title}</CardTitle>
            <CardDescription className="text-sm">
              {page.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild className="w-full text-sm sm:text-base">
              <Link href={page.path}>Configure</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SharedSettingCard;
