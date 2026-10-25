import { normalizeFavorites } from "@/lib/favorite-teams";
import { isVipActive } from "@/lib/vip";
import { createServiceClient } from "@/lib/supabase/server";
import { readProfile, saveProfile, type ProfileRow } from "@/lib/supabase/profile-row";
import { requestUser } from "@/lib/supabase/request-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";

function rowToProfile(row: ProfileRow) {
  const vipUntil = row.vip_until ?? null;
  return {
    id: row.id,
    displayName: row.display_name?.trim() || "Fan",
    avatarUrl: row.avatar_url?.trim() || null,
    bio: row.bio?.trim() || null,
    favoriteTeams: normalizeFavorites(row.favorite_teams),
    vipUntil,
    isVip: isVipActive(vipUntil),
    onboardingCompletedAt: row.onboarding_completed_at ?? null,
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { supabase, user } = await requestUser(request);
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { data, error } = await readProfile(supabase, user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({
      profile: {
        id: user.id,
        displayName:
          (user.user_metadata?.display_name as string | undefined)?.trim() ||
          user.email?.split("@")[0] ||
          "Fan",
        avatarUrl: null,
        bio: null,
        favoriteTeams: {},
        vipUntil: null,
        isVip: false,
        onboardingCompletedAt: null,
        updatedAt: null,
      },
    });
  }

  return NextResponse.json({ profile: rowToProfile(data) });
}

type PatchBody = {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  favoriteTeams?: Record<string, unknown>;
  completeOnboarding?: boolean;
};

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { supabase, user } = await requestUser(request);
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json()) as PatchBody;
  const displayName = body.displayName?.trim().slice(0, 32);
  const avatarUrl =
    body.avatarUrl === null || body.avatarUrl === ""
      ? null
      : body.avatarUrl?.trim().slice(0, 512);
  const bio =
    body.bio === null || body.bio === ""
      ? null
      : body.bio?.trim().slice(0, 160);

  if (displayName !== undefined && displayName.length < 2) {
    return NextResponse.json(
      { error: "Display name must be at least 2 characters." },
      { status: 400 },
    );
  }

  if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
    return NextResponse.json(
      { error: "Avatar URL must start with http:// or https://" },
      { status: 400 },
    );
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (displayName !== undefined) patch.display_name = displayName;
  if (body.avatarUrl !== undefined) patch.avatar_url = avatarUrl ?? null;
  if (body.bio !== undefined) patch.bio = bio ?? null;
  if (body.favoriteTeams !== undefined) {
    patch.favorite_teams = normalizeFavorites(body.favoriteTeams);
  }
  if (body.completeOnboarding === true) {
    patch.onboarding_completed_at = new Date().toISOString();
  }

  const { data, error } = await saveProfile(supabase, { id: user.id, ...patch });

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not save profile" }, { status: 500 });
  }

  return NextResponse.json({ profile: rowToProfile(data) });
}

export async function DELETE(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const { user } = await requestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 503 });
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
