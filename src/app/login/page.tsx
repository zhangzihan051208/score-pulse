import { Suspense } from "react";
import { LoginInner } from "./login-inner";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-3 py-16 text-center text-sm text-muted-foreground">
          …
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
