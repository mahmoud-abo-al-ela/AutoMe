"use client";

import { TestDrivePresenter } from "./_components/TestDrivePresenter";
import { useTestDrivePage } from "@/hooks/use-test-drive-page";

const TestDrivePage = () => {
    const pageData = useTestDrivePage();

    return <TestDrivePresenter {...pageData} />;
};

export default TestDrivePage;