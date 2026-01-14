"use client";

import { AdminMessagesPresenter } from "./_components/AdminMessagesPresenter";
import { useAdminMessages } from "@/hooks/use-admin-messages";

const AdminMessagesPage = () => {
  const pageData = useAdminMessages();

  return <AdminMessagesPresenter {...pageData} />;
};

export default AdminMessagesPage;
