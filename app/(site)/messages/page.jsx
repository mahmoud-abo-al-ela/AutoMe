"use client";

import { MessagesPresenter } from "./_components/MessagesPresenter";
import { useMessagesPage } from "@/hooks/use-messages-page";

const MessagesPage = () => {
    const pageData = useMessagesPage();

    return <MessagesPresenter {...pageData} />;
};

export default MessagesPage;
