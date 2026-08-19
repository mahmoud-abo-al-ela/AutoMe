"use client";

import { useState, useEffect } from "react";
import { formatCarPrice } from "@/lib/utils/currency";
import { toggleWishlist } from "@/actions/cars-listing";
import { checkExistingTestDrive } from "@/actions/test-drive";
import { toast } from "sonner";
import { compareUtils } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import type { CarDetail, PriceFormatter } from "../../_lib/car-detail-types";

export const useCarInfoCard = (car: CarDetail) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(car?.isWishlisted || false);
  const [isInCompare, setIsInCompare] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [testDriveId, setTestDriveId] = useState<string | null>(null);
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
    isLoading: isCheckingTestDrive,
  } = useQuery({
    queryKey: queryKeys.testDrives.check(car.id),
    queryFn: () => checkExistingTestDrive(car.id),
    enabled: !!isSignedIn,
  });

  useEffect(() => {
    // The action returns the raw {exists, testDriveId} on success but an
    // ErrorResponse on failure, so narrow before reading either field.
    if (testDriveData && "exists" in testDriveData && testDriveData.exists) {
      setTestDriveId(testDriveData.testDriveId);
    }
  }, [testDriveData]);

  const handleToggleFavorite = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await toggleWishlist(car.id);

      if (response.success) {
        setIsFavorite(!isFavorite);
        toast.success(response.message || "Wishlist updated");
        // `error` is an object, not a string — comparing it to "Unauthorized"
        // was never true, so auth failures fell through silently.
      } else if (response.error.code === "AUTHENTICATION_ERROR") {
        toast.error("Please sign in to add cars to your wishlist");
      } else {
        toast.error(response.error.message || "Failed to update wishlist");
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
    // Same destination either way — middleware handles the sign-in redirect.
    router.push(`/test-drive?carId=${car.id}`);
  };

  const handleViewTestDrive = () => {
    if (testDriveId) {
      router.push(`/test-drive?testDriveId=${testDriveId}`);
    } else {
      router.push(`/test-drive?carId=${car.id}`);
    }
  };

  const handleChatClick = () => {
    // Let middleware handle redirect if not signed in
    router.push(`/messages?carId=${car.id}`);
  };

  // Bound to this listing's own currency, so presenters stay currency-agnostic.
  const formatPrice: PriceFormatter = (price) =>
    formatCarPrice(price, "en", car.priceCurrency);

  return {
    isLoading,
    isScheduleLoading,
    isFavorite,
    isInCompare,
    isShareDialogOpen,
    setIsShareDialogOpen,
    testDriveId,
    isCheckingTestDrive,
    handleToggleFavorite,
    handleToggleCompare,
    handleShare,
    handleGoToCompare,
    handleScheduleTestDrive,
    handleViewTestDrive,
    handleChatClick,
    formatPrice,
    isSignedIn,
  };
};
