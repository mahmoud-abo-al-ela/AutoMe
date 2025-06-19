import Loading from "@/components/Loading";

export default function LoadingUI() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loading />
    </div>
  );
}
