import { SkeletonPageHeader, SkeletonChatLayout } from "@/components/common/Skeletons";

export default function MessagesLoading() {
  return (
    <div className="flex flex-col gap-6 w-full h-full max-h-screen overflow-hidden">
      <SkeletonPageHeader className="mb-6 sm:mb-8" />
      <SkeletonChatLayout />
    </div>
  );
}
