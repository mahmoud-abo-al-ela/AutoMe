"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  Heart,
  Share2,
  Phone,
  MessageCircle,
  Scale,
  CalendarDays,
  Check,
  Info,
} from "lucide-react";
import { toggleWishlist } from "@/actions/cars-listing";
import { checkExistingTestDrive } from "@/actions/test-drive";
import CarSpecifications from "./CarSpecifications";
import ShareDialog from "./ShareDialog";
import { toast } from "sonner";
import { compareUtils } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useFetch from "@/hooks/use-fetch";

const CarInfoCard = ({ car }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(car?.isWishlisted || false);
  const [isInCompare, setIsInCompare] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [testDriveId, setTestDriveId] = useState(null);
  const [checkingTestDrive, setCheckingTestDrive] = useState(false);
  const router = useRouter();
  const { isSignedIn } = useUser();

  // Check if car is in compare list on component mount
  useEffect(() => {
    const compareList = compareUtils.getCompareList();
    setIsInCompare(compareList.includes(car.id));

    // Add event listener for compare list updates
    const handleStorageChange = () => {
      const updatedList = compareUtils.getCompareList();
      setIsInCompare(updatedList.includes(car.id));
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("compareListUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("compareListUpdated", handleStorageChange);
    };
  }, [car.id]);

  const {
    data: testDriveData,
    loading: isCheckingTestDrive,
    error,
    fn: checkTestDrive,
  } = useFetch(checkExistingTestDrive, false);

  useEffect(() => {
    if (isSignedIn) {
      checkTestDrive(car.id);
    }
  }, [car.id, isSignedIn]);

  useEffect(() => {
    if (testDriveData?.exists) {
      setTestDriveId(testDriveData.testDriveId);
    }
  }, [testDriveData]);

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await toggleWishlist(car.id);

      if (response.success) {
        setIsFavorite(!isFavorite);
        toast.success(response.message);
      } else if (response.error === "Unauthorized") {
        toast.error("Please sign in to add cars to your wishlist");
      }
    } catch (error) {
      console.error("Failed to toggle wishlist", error);
      toast.error("Failed to update wishlist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCompare = () => {
    if (isInCompare) {
      compareUtils.removeFromCompare(car.id);
      setIsInCompare(false);
      toast.info("Removed from comparison");
      window.dispatchEvent(new Event("compareListUpdated"));
    } else {
      const added = compareUtils.addToCompare(car.id);
      if (added) {
        setIsInCompare(true);
        toast.success("Added to comparison");
        window.dispatchEvent(new Event("compareListUpdated"));
      } else {
        toast.warning("You can compare up to 3 cars at a time");
      }
    }
  };

  const handleShare = () => {
    setIsShareDialogOpen(true);
  };

  const handleGoToCompare = () => {
    router.push("/compare");
  };

  const handleScheduleTestDrive = () => {
    setIsScheduleLoading(true);

    if (!isSignedIn) {
      // If user is not signed in, redirect to sign-in page with redirect URL back to reservation
      const redirectUrl = `/reservation?carId=${car.id}`;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    // If user is signed in, navigate directly to reservation page
    router.push(`/reservation?carId=${car.id}`);
  };

  const handleViewTestDrive = () => {
    if (testDriveId) {
      router.push(`/reservation?testDriveId=${testDriveId}`);
    } else {
      router.push(`/reservation?carId=${car.id}`);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "AVAILABLE":
        return (
          <Badge className="bg-green-100 text-green-800 border-0 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
            Available
          </Badge>
        );
      case "SOLD":
        return (
          <Badge className="bg-red-100 text-red-800 border-0 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
            Sold
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-0 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTestDriveButton = () => {
    // If car is not available
    if (car.status !== "AVAILABLE") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  variant="outline"
                  disabled
                  className="w-full py-3 sm:py-4 rounded-xl cursor-not-allowed opacity-60"
                >
                  <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Schedule Test Drive
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>This car is not available for test drives</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // If checking for existing test drive
    if (isCheckingTestDrive) {
      return (
        <Button
          variant="outline"
          disabled
          className="w-full py-3 sm:py-4 rounded-xl"
        >
          <div className="w-4 h-4 border-2 border-t-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
          Checking...
        </Button>
      );
    }

    // If user has already scheduled a test drive
    if (testDriveId) {
      return (
        <Button
          variant="outline"
          onClick={handleViewTestDrive}
          className="w-full py-3 sm:py-4 rounded-xl hover:scale-105 transition-transform cursor-pointer bg-blue-50 border-blue-200 text-blue-700"
        >
          <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          View Your Test Drive
        </Button>
      );
    }

    // Default case: Schedule a test drive
    return (
      <Button
        variant="outline"
        onClick={handleScheduleTestDrive}
        disabled={isScheduleLoading}
        className="w-full py-3 sm:py-4 rounded-xl hover:scale-105 transition-transform cursor-pointer"
      >
        {isScheduleLoading ? (
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-t-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            Processing...
          </div>
        ) : (
          <>
            <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Schedule Test Drive
          </>
        )}
      </Button>
    );
  };

  return (
    <>
      <Card className="shadow-xl border-0 bg-white p-0">
        <CardContent className="p-4 sm:p-6 md:p-8">
          {/* Header with badges */}
          <div className="flex items-start justify-between mb-4 sm:mb-6">
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {car.featured && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Featured
                </Badge>
              )}
              {getStatusBadge(car.status)}
            </div>
            <div className="flex gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFavorite}
                disabled={isLoading}
                className={`hover:scale-110 transition-transform cursor-pointer ${
                  isFavorite
                    ? "text-red-500 border-red-200 bg-red-50"
                    : "hover:text-red-500"
                }`}
              >
                <Heart
                  className={`w-3 h-3 sm:w-4 sm:h-4 ${
                    isFavorite ? "fill-current" : ""
                  }`}
                />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleCompare}
                className={`hover:scale-110 transition-transform cursor-pointer ${
                  isInCompare
                    ? "text-blue-500 border-blue-200 bg-blue-50"
                    : "hover:text-blue-500"
                }`}
              >
                <Scale
                  className={`w-3 h-3 sm:w-4 sm:h-4 ${
                    isInCompare ? "fill-current" : ""
                  }`}
                />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="hover:scale-110 transition-transform cursor-pointer"
              >
                <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>

          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
              {car.title || `${car.year} ${car.make} ${car.model}`}
            </h1>
            <div className="flex items-baseline gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {formatPrice(car.price)}
              </div>
              {car.oldPrice && (
                <div className="text-xs sm:text-sm text-gray-500 line-through">
                  {formatPrice(car.oldPrice)}
                </div>
              )}
            </div>
          </div>

          <CarSpecifications car={car} />

          <Separator className="my-6 sm:my-8" />

          <div className="space-y-3 sm:space-y-4">
            <Button className="cursor-pointer w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 sm:py-6 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Chat Now
            </Button>

            {getTestDriveButton()}

            {isInCompare && (
              <Button
                variant="secondary"
                onClick={handleGoToCompare}
                className="w-full py-2 sm:py-3 rounded-xl hover:scale-105 transition-transform cursor-pointer text-xs sm:text-sm"
              >
                <Scale className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Go to Compare
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ShareDialog
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        car={car}
      />
    </>
  );
};

export default CarInfoCard;
