import { RankingsPageInner } from "@/components/rankings-page";
import { Suspense } from "react";

export const metadata = {
  title: "Rankings",
};

export default function RankingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-3 py-10 text-sm text-muted-foreground">
          …
        </div>
      }
    >
      <RankingsPageInner />
    </Suspense>
  );
}
