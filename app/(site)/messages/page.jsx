import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { MessagesPageClient } from "./_components/MessagesPageClient";
import { getMyConversations } from "@/actions/messages";
import { db as prisma } from "@/lib/prisma";

export const metadata = {
  title: "Messages",
  description: "Chat with dealerships",
};

export default async function MessagesPage() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    redirect("/sign-in");
  }

  const result = await getMyConversations();
  const conversations = result.success ? result.data : [];

  return (
    <MessagesPageClient
      initialConversations={conversations}
      currentUserId={user.id}
    />
  );
}
