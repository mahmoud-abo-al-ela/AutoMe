"use client";

import { TestDrivesPresenter } from "./_components/TestDrivesPresenter";
import { useAdminTestDrives } from "@/hooks/use-admin-test-drives";

const TestDrivesPage = () => {
  const pageData = useAdminTestDrives();

  return <TestDrivesPresenter {...pageData} />;
};

export default TestDrivesPage;
