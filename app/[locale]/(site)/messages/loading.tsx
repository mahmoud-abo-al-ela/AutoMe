import { SkeletonPageHeader, SkeletonChatLayout } from "@/components/common/Skeletons";

export default function PublicMessagesLoading() {
  return (
    <div className="container mx-auto px-4 pb-6 pt-20 max-w-[1600px] flex flex-col">
      <SkeletonPageHeader className="mb-6 sm:mb-8" />
      <div className="flex-1 overflow-hidden">
        <SkeletonChatLayout />
      </div>
    </div>
  );
}
