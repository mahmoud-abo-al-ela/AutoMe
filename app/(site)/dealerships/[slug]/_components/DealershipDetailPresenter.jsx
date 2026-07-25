"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Home, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDealershipBySlug, getDealershipCars, getDealershipCarFilters } from "@/actions/dealerships";
import { DealershipDetailSkeleton } from "../../_components/DealershipSkeleton";
import {
    generateDealershipStructuredData,
    generateBreadcrumbStructuredData,
    StructuredData,
} from "@/lib/utils/seo";
import {
    DealershipHeader,
    DealershipStats,
    DealershipTabs,
    DealershipErrorState,
} from "./index";

export const DealershipDetailPresenter = () => {
    const params = useParams();
    const slug = params.slug;

    const [dealership, setDealership] = useState(null);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [carsLoading, setCarsLoading] = useState(false);
    const [filters, setFilters] = useState({ sortBy: "newest" });
    const [availableFilters, setAvailableFilters] = useState(null);
    const [carsPagination, setCarsPagination] = useState({
        page: 1,
        limit: 6,
        total: 0,
        totalPages: 0,
    });

    useEffect(() => {
        const fetchDealership = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getDealershipBySlug(slug);
                if (response.success) {
                    setDealership(response.data);
                    // Fetch filter options
                    const filterResponse = await getDealershipCarFilters(response.data.id);
                    if (filterResponse.success) {
                        setAvailableFilters(filterResponse.data);
                    }
                    // Fetch cars for this dealership
                    await fetchCars(response.data.id, { sortBy: "newest" }, 1);
                } else {
                    setError(response.error?.message || "Failed to load dealership");
                }
            } catch (err) {
                console.error("Error fetching dealership:", err);
                setError("Failed to load dealership. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchDealership();
    }, [slug]);

    const fetchCars = async (organizationId, currentFilters = {}, page = 1) => {
        setCarsLoading(true);
        try {
            const response = await getDealershipCars(organizationId, currentFilters, {
                page,
                limit: carsPagination.limit,
            });
            if (response.success) {
                setCars(response.data.cars);
                setCarsPagination(response.data.pagination);
            }
        } catch (err) {
            console.error("Error fetching cars:", err);
        } finally {
            setCarsLoading(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setCarsPagination((prev) => ({ ...prev, page: 1 }));
        if (dealership) {
            fetchCars(dealership.id, newFilters, 1);
        }
    };

    const handlePageChange = (newPage) => {
        setCarsPagination((prev) => ({ ...prev, page: newPage }));
        if (dealership) {
            fetchCars(dealership.id, filters, newPage);
        }
        const section = document.getElementById("dealership-cars-section");
        if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            window.scrollTo({ top: 400, behavior: "smooth" });
        }
    };

    if (loading) {
        return <DealershipDetailSkeleton />;
    }

    if (error || !dealership) {
        return <DealershipErrorState error={error} />;
    }

    return (
        <>
            {/* Structured Data for SEO */}
            {dealership && (
                <>
                    <StructuredData data={generateDealershipStructuredData(dealership)} />
                    <StructuredData
                        data={generateBreadcrumbStructuredData([
                            { name: "Home", url: "/" },
                            { name: "Dealerships", url: "/dealerships" },
                            { name: dealership.name, url: `/dealerships/${dealership.slug}` },
                        ])}
                    />
                </>
            )}

            <div className="container mx-auto py-4 px-4 mt-18">
                {/* Breadcrumb Navigation */}
                <nav
                    aria-label="Breadcrumb"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6"
                >
                    <Link
                        href="/"
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                        <Home className="h-3.5 w-3.5" />
                        <span>Home</span>
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <Link
                        href="/dealerships"
                        className="hover:text-foreground transition-colors"
                    >
                        Dealerships
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-foreground font-medium truncate max-w-[200px]">
                        {dealership.name}
                    </span>
                </nav>

                {/* Hero Header Section */}
                <DealershipHeader dealership={dealership} />

                {/* Stats Bar */}
                <DealershipStats dealership={dealership} />

                {/* Tabbed Content */}
                <DealershipTabs
                    dealership={dealership}
                    cars={cars}
                    carsLoading={carsLoading}
                    carsPagination={carsPagination}
                    onPageChange={handlePageChange}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    availableFilters={availableFilters}
                />
            </div>
        </>
    );
};

export default DealershipDetailPresenter;
