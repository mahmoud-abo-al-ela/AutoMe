import { redirect } from "next/navigation";

export default async function OrganizationHomePage({ params }) {
    const { slug } = await params;
    redirect(`/org/${slug}/dashboard`);
}

