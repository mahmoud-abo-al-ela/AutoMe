"use client";

import Image from "next/image";
import { MessageSquare, ArrowLeft, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConversationList, ChatWindow } from "@/components/Chat";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function MessagesPresenter({
  conversations,
  loading,
  error,
  selectedConversation,
  currentUserId,
  currentUserName,
  isLoaded,
  handleSelectConversation,
}) {
  // Loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-20 pb-4 sm:pb-6 px-3 sm:px-4 lg:px-6 space-y-3 sm:space-y-6 h-screen overflow-hidden">
      {/* Header - Hidden on mobile when conversation selected */}
      <div
        className={cn(
          "transition-all duration-200",
          selectedConversation && "hidden sm:block"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-bold">Messages</h1>
            <Badge variant="secondary" className="sm:hidden text-xs">
              {conversations?.length || 0}
            </Badge>
          </div>
          <Badge variant="outline" className="hidden sm:flex">
            {conversations?.length || 0} conversation
            {conversations?.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Chat with our team about cars
        </p>
      </div>

      {/* Main content */}
      {error ? (
        <div className="p-6 sm:p-8 text-center rounded-lg bg-white border">
          <p className="text-destructive mb-4 text-sm sm:text-base">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            size="sm"
            className="sm:size-default"
          >
            Try Again
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "flex rounded-lg border bg-white overflow-hidden",
            selectedConversation
              ? "h-[calc(100vh-5rem)] sm:h-[calc(100vh-12rem)]"
              : "h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)]"
          )}
        >
          {/* Conversation list */}
          <div
            className={cn(
              "w-full sm:w-72 md:w-80 lg:w-96 border-r flex-shrink-0 flex flex-col",
              selectedConversation && "hidden sm:flex"
            )}
          >
            <div className="p-3 sm:p-4 border-b">
              <h2 className="font-semibold text-sm sm:text-base">
                Your Conversations
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                conversations={conversations}
                activeConversationId={selectedConversation?.id}
                onSelectConversation={handleSelectConversation}
                loading={loading}
                emptyMessage="No conversations yet. Start one from a car listing!"
              />
            </div>
          </div>

          {/* Chat window */}
          <div
            className={cn(
              "flex-1 flex flex-col min-w-0",
              !selectedConversation && "hidden sm:flex"
            )}
          >
            {selectedConversation ? (
              <>
                {/* Header with car info */}
                <div className="p-2 sm:p-4 border-b">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="sm:hidden flex-shrink-0 h-9 w-9"
                        onClick={() => handleSelectConversation(null)}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>

                      {selectedConversation.car?.images?.[0] ? (
                        <Image
                          src={selectedConversation.car.images[0]}
                          alt=""
                          width={40}
                          height={40}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm sm:text-base truncate">
                          {selectedConversation.car.title}
                        </h3>
                      </div>
                    </div>

                    {/* View car link */}
                    {selectedConversation.car && (
                      <Link
                        href={`/cars/${selectedConversation.car.id}`}
                        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-xs sm:text-sm flex-shrink-0"
                      >
                        View Car
                      </Link>
                    )}
                  </div>
                </div>

                {/* Chat */}
                <div className="flex-1 overflow-hidden">
                  <ChatWindow
                    conversationId={selectedConversation.id}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    className="h-full"
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center max-w-xs">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2">
                    Select a conversation
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Choose a conversation from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
