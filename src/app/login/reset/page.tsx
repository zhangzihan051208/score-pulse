import { Suspense } from "react";
import { ResetPasswordInner } from "./reset-inner";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-3 py-16 text-center text-sm text-muted-foreground">
          …
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
