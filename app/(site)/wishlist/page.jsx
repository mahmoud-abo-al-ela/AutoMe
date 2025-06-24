"use client";

import { getWishlist } from "@/actions/cars-listing";
import { Heart, Car, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import CarCard from "@/components/CarCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CarCardSkeleton from "@/components/CarCardSkeleton";
import useFetch from "@/hooks/use-fetch";

const WishlistPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 6;

  const { data, loading, fn, error, setData } = useFetch(getWishlist, true);

  useEffect(() => {
    fn({ page: currentPage, limit });
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleWishlistChange = (removedCarId) => {
    if (data?.success && data.data?.cars) {
      const updatedCars = data.data.cars.filter(
        (car) => car.id !== removedCarId
      );
      const updatedTotal = data.data.pagination.total - 1;
      const updatedTotalPages = Math.ceil(updatedTotal / limit);

      setData({
        ...data,
        data: {
          ...data.data,
          cars: updatedCars,
          pagination: {
            ...data.data.pagination,
            total: updatedTotal,
            totalPages: updatedTotalPages,
          },
        },
      });

      if (updatedCars.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else if (currentPage > updatedTotalPages) {
        setCurrentPage(updatedTotalPages || 1);
      } else {
        fn({ page: currentPage, limit });
      }
    }
  };

  const cars = data?.success ? data.data?.cars : [];
  const pagination = data?.success
    ? data.data?.pagination
    : { total: 0, page: 1, limit, totalPages: 0 };
  const isEmpty = !cars || cars.length === 0;

  const getPageNumbers = () => {
    if (!pagination) return [];

    const { page, totalPages } = pagination;
    const pageNumbers = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else if (page <= 3) {
      for (let i = 1; i <= 5; i++) {
        pageNumbers.push(i);
      }
    } else if (page >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      for (let i = page - 2; i <= page + 2; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  return (
    <div className="container py-20 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-7 w-7 text-primary" />
            <h1 className="text-xl sm:text-3xl font-bold">Your Wishlist</h1>
            {!loading && !isEmpty && pagination && (
              <Badge variant="outline" className="ml-2 bg-primary/5">
                {pagination.total} {pagination.total === 1 ? "car" : "cars"}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Save cars you're interested in and come back to them later.
          </p>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, index) => (
            <CarCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error loading wishlist
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={() => fn({ page: 1, limit })}
            variant="outline"
            className="bg-white cursor-pointer"
          >
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
          <div className="bg-primary/10 p-4 rounded-full mb-6">
            <Heart className="h-8 w-8 md:h-10 md:w-10 text-primary" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-3">
            Your wishlist is empty
          </h3>
          <p className="text-base text-muted-foreground mb-8 max-w-md">
            Browse our inventory and add cars to your wishlist by clicking the
            heart icon. Come back to compare your options later.
          </p>
          <Link href="/cars">
            <Button className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 cursor-pointer">
              <Car className="h-4 w-4" />
              Browse Cars
            </Button>
          </Link>
        </div>
      )}

      {!loading && !error && !isEmpty && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {cars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                onWishlistChange={handleWishlistChange}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="cursor-pointer h-10 w-10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers().map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={
                      pagination.page === pageNum ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-10 h-10 cursor-pointer"
                  >
                    {pageNum}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="cursor-pointer h-10 w-10"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {pagination && pagination.total > 0 && (
            <div className="text-center text-sm text-muted-foreground mt-4">
              Showing{" "}
              {Math.min(
                (pagination.page - 1) * pagination.limit + 1,
                pagination.total
              )}{" "}
              to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} cars
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WishlistPage;
