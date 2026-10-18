"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PlayerAvatar } from "@/components/player-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useI18n } from "@/i18n/use-i18n";

export function ProfilePageInner() {
  const { t } = useI18n();
  const { user, enabled, loading: authLoading } = useAuth();
  const { profile, loading, cloud, save } = useProfile();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setAvatarUrl(profile.avatarUrl ?? "");
    setBio(profile.bio ?? "");
  }, [profile]);

  if (!enabled || !cloud) {
    return (
      <div className="mx-auto max-w-lg px-3 py-10">
        <p className="text-sm text-muted-foreground">{t.profile.notConfigured}</p>
        <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← {t.nav.home}
        </Link>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-lg px-3 py-10 text-sm text-muted-foreground">
        {t.auth.loading}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-3 py-10">
        <h1 className="text-2xl font-bold">{t.profile.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.profile.signInRequired}</p>
        <Link
          href="/login?next=/profile"
          className="mt-4 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          {t.auth.signIn}
        </Link>
      </div>
    );
  }

  const previewAthlete = {
    name: displayName || profile?.displayName || "Fan",
    shortName: (displayName || "F").slice(0, 2).toUpperCase(),
    photoUrl: avatarUrl.trim() || undefined,
    jerseyNumber: undefined,
  };

  return (
    <div className="mx-auto max-w-lg px-3 py-8">
      <Link href="/" className="text-xs text-muted-foreground hover:underline">
        ← {t.nav.home}
      </Link>
      <h1 className="mt-3 text-2xl font-bold">{t.profile.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.profile.lead}</p>

      <div className="mt-6 flex items-center gap-4">
        <PlayerAvatar athlete={previewAthlete} size="lg" showJerseyBadge={false} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{previewAthlete.name}</p>
          {bio.trim() ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{bio}</p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">{t.profile.bioHint}</p>
          )}
        </div>
      </div>

      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          setSaved(false);
          const result = await save({
            displayName,
            avatarUrl: avatarUrl.trim() || null,
            bio: bio.trim() || null,
          });
          setSaving(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setSaved(true);
        }}
      >
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="displayName">
            {t.profile.displayName}
          </label>
          <Input
            id="displayName"
            value={displayName}
            maxLength={32}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setSaved(false);
            }}
          />
          <p className="text-xs text-muted-foreground">{t.profile.displayNameHint}</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="avatarUrl">
            {t.profile.avatarUrl}
          </label>
          <Input
            id="avatarUrl"
            type="url"
            value={avatarUrl}
            placeholder="https://"
            onChange={(e) => {
              setAvatarUrl(e.target.value);
              setSaved(false);
            }}
          />
          <p className="text-xs text-muted-foreground">{t.profile.avatarHint}</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="bio">
            {t.profile.bio}
          </label>
          <Textarea
            id="bio"
            value={bio}
            maxLength={160}
            rows={3}
            onChange={(e) => {
              setBio(e.target.value);
              setSaved(false);
            }}
          />
          <p className="text-xs text-muted-foreground">{t.profile.bioHint}</p>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {saved ? <p className="text-sm text-primary">{t.profile.saved}</p> : null}
        <Button type="submit" className="w-full" disabled={saving}>
          {t.profile.save}
        </Button>
      </form>
    </div>
  );
}
