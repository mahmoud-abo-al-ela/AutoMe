import { getDealerships } from "@/actions/dealerships";

export default async function sitemap() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://autome.com";

    try {
        // Fetch all dealerships (you may want to paginate this for large datasets)
        const response = await getDealerships({}, { page: 1, limit: 1000 });

        if (!response.success || !response.data?.dealerships) {
            return [
                {
                    url: `${baseUrl}/dealerships`,
                    lastModified: new Date(),
                    changeFrequency: "daily",
                    priority: 0.8,
                },
            ];
        }

        const dealerships = response.data.dealerships;

        // Generate sitemap entries for each dealership
        const dealershipUrls = dealerships.map((dealership) => ({
            url: `${baseUrl}/dealerships/${dealership.slug}`,
            lastModified: dealership.updatedAt || new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        }));

        // Add the main dealerships page
        return [
            {
                url: `${baseUrl}/dealerships`,
                lastModified: new Date(),
                changeFrequency: "daily",
                priority: 0.8,
            },
            ...dealershipUrls,
        ];
    } catch (error) {
        console.error("Error generating dealerships sitemap:", error);
        return [
            {
                url: `${baseUrl}/dealerships`,
                lastModified: new Date(),
                changeFrequency: "daily",
                priority: 0.8,
            },
        ];
    }
}
