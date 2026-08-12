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

export const useCarInfoCard = (car) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(car?.isWishlisted || false);
  const [isInCompare, setIsInCompare] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [testDriveId, setTestDriveId] = useState(null);
  const router = useRouter();
  const { isSignedIn, user } = useUser();

  // Get current user info for chat
  const currentUserId = user?.id;
  const currentUserName =
    user?.fullName ||
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress;

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
        // `error` is an object, not a string — comparing it to "Unauthorized"
        // was never true, so auth failures fell through silently.
      } else if (response.error?.code === "AUTHENTICATION_ERROR") {
        toast.error("Please sign in to add cars to your wishlist");
      } else {
        toast.error(response.error?.message || "Failed to update wishlist");
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
      // If user is not signed in, let middleware handle redirect
      router.push(`/test-drive?carId=${car.id}`);
      return;
    }

    // If user is signed in, navigate directly to reservation page
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

  const formatPrice = (price) => formatCarPrice(price);

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
    // User info for chat
    isSignedIn,
    currentUserId,
    currentUserName,
  };
};
