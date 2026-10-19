import { LoadingView } from "@/components/loading-view";

export default function EventLoading() {
  return (
    <div className="mx-auto max-w-3xl px-3 py-6">
      <LoadingView message="page" variant="section" />
    </div>
  );
}
