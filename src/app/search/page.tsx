import { Suspense } from "react";
import { SearchPageInner } from "@/components/search-page";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-3 py-8 text-sm text-muted-foreground">…</div>}>
      <SearchPageInner />
    </Suspense>
  );
}
