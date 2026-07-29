"use client";

import { DealershipsPagePresenter } from "./_components";
import { useDealershipsPage } from "@/hooks/use-dealerships-page";

const ClientPage = ({ initialData, initialState }) => {
    const pageData = useDealershipsPage(initialData, initialState);

    return <DealershipsPagePresenter {...pageData} />;
};

export default ClientPage;
