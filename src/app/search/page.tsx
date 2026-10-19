import { Suspense } from "react";
import { LoadingView } from "@/components/loading-view";
import { SearchPageInner } from "@/components/search-page";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-3 py-8">
          <LoadingView message="page" variant="section" />
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
