import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { UserChannelList, ChatWindow } from "@/components/StreamChat";

export const metadata = {
  title: "Messages | AutoMe",
  description: "Chat with dealerships about cars you're interested in",
};

export default async function MessagesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto px-4 pb-6 pt-20 max-w-[1600px]">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Messages</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Chat with dealerships about cars you're interested in
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-0 h-[calc(100vh-220px)] md:h-[calc(100vh-200px)] border rounded-lg overflow-hidden bg-card shadow-sm">
        {/* Channel List */}
        <div className="border-r flex flex-col overflow-hidden bg-background">
          <UserChannelList />
        </div>

        {/* Chat Window */}
        <div className="flex flex-col overflow-hidden bg-background">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}
