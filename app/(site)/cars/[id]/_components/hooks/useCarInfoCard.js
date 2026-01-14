"use client";

import { useState, useEffect } from "react";
import { toggleWishlist } from "@/actions/cars-listing";
import { checkExistingTestDrive } from "@/actions/test-drive";
import { toast } from "sonner";
import { compareUtils } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import useFetch from "@/hooks/use-fetch";

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
    const currentUserName = user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress;

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
            const redirectUrl = `/test-drive?carId=${car.id}`;
            router.push(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
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
        // Redirect to sign-in if not signed in
        const redirectUrl = `/cars/${car.id}`;
        router.push(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(price);
    };

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