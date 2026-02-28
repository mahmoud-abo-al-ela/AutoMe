/**
 * SEO Utilities for Dealerships
 * Generates structured data (JSON-LD) for better search engine visibility
 */

export function generateDealershipStructuredData(dealership) {
    if (!dealership) return null;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "AutoDealer",
        name: dealership.name,
        description: dealership.description || `${dealership.name} - Automotive Dealership`,
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://autome.com'}/dealerships/${dealership.slug}`,
    };

    // Add logo if available
    if (dealership.logo) {
        structuredData.image = dealership.logo;
        structuredData.logo = dealership.logo;
    }

    // Add address if available
    if (dealership.address || dealership.location) {
        structuredData.address = {
            "@type": "PostalAddress",
            streetAddress: dealership.address || "",
            addressLocality: dealership.location?.city || "",
            addressRegion: dealership.location?.state || "",
            postalCode: dealership.location?.postalCode || "",
            addressCountry: dealership.location?.country || "US",
        };
    }

    // Add contact information
    if (dealership.phone) {
        structuredData.telephone = dealership.phone;
    }

    if (dealership.email) {
        structuredData.email = dealership.email;
    }

    if (dealership.website) {
        structuredData.url = dealership.website;
    }

    // Add aggregate rating if available
    if (dealership.averageRating && dealership.totalReviews > 0) {
        structuredData.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: dealership.averageRating.toFixed(1),
            reviewCount: dealership.totalReviews,
            bestRating: "5",
            worstRating: "1",
        };
    }

    // Add opening hours if available
    if (dealership.workingHours && dealership.workingHours.length > 0) {
        structuredData.openingHoursSpecification = dealership.workingHours
            .filter(wh => wh.isOpen)
            .map(wh => ({
                "@type": "OpeningHoursSpecification",
                dayOfWeek: wh.day,
                opens: wh.openTime,
                closes: wh.closeTime,
            }));
    }

    // Add geo coordinates if available
    if (dealership.location?.latitude && dealership.location?.longitude) {
        structuredData.geo = {
            "@type": "GeoCoordinates",
            latitude: dealership.location.latitude,
            longitude: dealership.location.longitude,
        };
    }

    return structuredData;
}

/**
 * Generate JSON-LD structured data for dealership reviews
 * @param {Array} reviews - Array of review objects
 * @param {Object} dealership - Dealership data
 * @returns {Array} Array of JSON-LD review objects
 */
export function generateReviewsStructuredData(reviews, dealership) {
    if (!reviews || reviews.length === 0) return [];

    return reviews.map(review => ({
        "@context": "https://schema.org",
        "@type": "Review",
        itemReviewed: {
            "@type": "AutoDealer",
            name: dealership.name,
        },
        author: {
            "@type": "Person",
            name: review.user?.name || "Anonymous",
        },
        reviewRating: {
            "@type": "Rating",
            ratingValue: review.rating,
            bestRating: "5",
            worstRating: "1",
        },
        reviewBody: review.comment || review.title || "",
        datePublished: review.createdAt,
    }));
}

/**
 * Generate breadcrumb structured data
 * @param {Array} items - Array of breadcrumb items { name, url }
 * @returns {Object} JSON-LD breadcrumb data
 */
export function generateBreadcrumbStructuredData(items) {
    if (!items || items.length === 0) return null;

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

/**
 * Generate meta tags for dealership page
 * @param {Object} dealership - Dealership data
 * @returns {Object} Meta tags object
 */
export function generateDealershipMetaTags(dealership) {
    if (!dealership) return {};

    const title = `${dealership.name} - AutoMe Dealership`;
    const description = dealership.description ||
        `View ${dealership.name}'s inventory, reviews, and contact information. ${dealership.carCount || 0} cars available.`;

    const keywords = [
        dealership.name,
        "dealership",
        "car dealership",
        "automotive",
        "cars for sale",
        dealership.location?.city,
        dealership.location?.state,
    ].filter(Boolean);

    return {
        title,
        description,
        keywords: keywords.join(", "),
        openGraph: {
            title,
            description,
            type: "website",
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://autome.com'}/dealerships/${dealership.slug}`,
            images: [
                {
                    url: dealership.logo || "/og-image.jpg",
                    width: 1200,
                    height: 630,
                    alt: `${dealership.name} logo`,
                },
            ],
            siteName: "AutoMe",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [dealership.logo || "/og-image.jpg"],
        },
    };
}

/**
 * Component to inject structured data into page head
 * @param {Object} data - Structured data object
 * @returns {JSX.Element} Script tag with JSON-LD
 */
export function StructuredData({ data }) {
    if (!data) return null;

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}
