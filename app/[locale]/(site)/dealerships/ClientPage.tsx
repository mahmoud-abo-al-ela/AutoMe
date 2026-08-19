"use client";

import { DealershipsPagePresenter } from "./_components";
import { useDealershipsPage } from "@/hooks/use-dealerships-page";

type UseDealershipsPageArgs = Parameters<typeof useDealershipsPage>;

const ClientPage = ({
    initialData,
    initialState,
}: {
    initialData: UseDealershipsPageArgs[0];
    initialState: UseDealershipsPageArgs[1];
}) => {
    const pageData = useDealershipsPage(initialData, initialState);

    return <DealershipsPagePresenter {...pageData} />;
};

export default ClientPage;
