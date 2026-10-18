"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/i18n/use-i18n";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function AuthMenu() {
  const { t } = useI18n();
  const { user, loading, enabled } = useAuth();
  const router = useRouter();

  if (!enabled) return null;

  if (loading) {
    return (
      <span className="hidden text-xs text-white/50 sm:inline">{t.auth.loading}</span>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-md border border-white/25 px-2 py-1 text-xs font-medium text-white hover:bg-white/10 sm:text-sm"
      >
        {t.auth.signIn}
      </Link>
    );
  }

  const label =
    (user.user_metadata?.display_name as string | undefined) ||
    user.email?.split("@")[0] ||
    t.auth.signedIn;

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[8rem] truncate text-xs text-white/70 sm:inline">
        {label}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-white/80 hover:bg-white/10 hover:text-white"
        onClick={async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          router.refresh();
        }}
      >
        {t.auth.signOut}
      </Button>
    </div>
  );
}
