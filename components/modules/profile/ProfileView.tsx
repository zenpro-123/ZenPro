"use client";

import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  Bookmark,
  Briefcase,
  Info,
  Monitor,
  Moon,
  StickyNote,
  Sun,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ZenProMark } from "@/components/shared/ZenProMark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/userStore";
import { useUIStore } from "@/stores/uiStore";
import { useMounted } from "@/lib/hooks/useMounted";
import { cn } from "@/lib/utils";
import { APP_VERSION, BUILD_DATE } from "@/config/app";
import type { UserStats } from "@/app/api/user/stats/route";

async function fetchStats(): Promise<{ data: UserStats }> {
  const res = await fetch("/api/user/stats");
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard static className="p-6">
      <div className="flex items-center gap-2.5">
        <span className="ring-gradient flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-chart-2/15 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="font-heading text-sm font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </GlassCard>
  );
}

function TagList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant="secondary" className="capitalize">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number | null }) {
  return (
    <div className="rounded-2xl border border-foreground/[0.07] bg-foreground/[0.02] p-4">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-3 font-heading text-2xl font-semibold tabular-nums">
        {value === null ? "—" : value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function ProfileView() {
  const profile = useUserStore((s) => s.profile);
  const preferences = useUserStore((s) => s.preferences);
  const setAboutOpen = useUIStore((s) => s.setAboutOpen);
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const { data } = useQuery({
    queryKey: ["user-stats"],
    queryFn: fetchStats,
    staleTime: 60 * 1000,
    enabled: !!profile,
  });

  const stats = data?.data ?? null;

  const initials = (profile?.name ?? profile?.email ?? "Z")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-8">
      <SectionHeader
        icon={UserRound}
        eyebrow="Account"
        title="Profile"
        subtitle="Your account, preferences, and activity at a glance"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account */}
        <Panel icon={UserRound} title="Account">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatarUrl ?? undefined} alt={profile?.name ?? "User"} />
              <AvatarFallback className="bg-primary/15 text-lg font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-heading text-lg font-semibold">
                {profile?.name ?? "Your account"}
              </p>
              <p className="truncate text-sm text-muted-foreground">{profile?.email ?? "—"}</p>
              {memberSince && (
                <p className="mt-1 text-xs text-muted-foreground/70">Member since {memberSince}</p>
              )}
            </div>
          </div>
        </Panel>

        {/* Activity */}
        <Panel icon={Bookmark} title="Activity">
          <div className="grid grid-cols-3 gap-3">
            <Stat icon={Bookmark} label="Saved" value={stats?.savedCount ?? null} />
            <Stat icon={StickyNote} label="Notes" value={stats?.notesCount ?? null} />
            <Stat icon={Briefcase} label="Applications" value={stats?.applicationsCount ?? null} />
          </div>
        </Panel>

        {/* Preferences */}
        <Panel icon={Info} title="Preferences">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
                Interests
              </p>
              <TagList items={preferences?.interests ?? []} empty="No interests selected yet." />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
                Favorite topics
              </p>
              <TagList items={preferences?.favoriteTopics ?? []} empty="No favorite topics yet." />
            </div>
          </div>
        </Panel>

        {/* Theme */}
        <Panel icon={Sun} title="Theme">
          <p className="mb-3 text-sm text-muted-foreground">
            Choose how ZenPro looks. System follows your device setting.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = mounted && theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border p-4 text-xs font-medium transition-all",
                    active
                      ? "ring-gradient border-primary/30 bg-gradient-to-br from-primary/15 to-chart-2/10 text-foreground"
                      : "border-foreground/[0.07] bg-foreground/[0.02] text-muted-foreground hover:border-primary/20 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "text-primary")} />
                  {label}
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* About ZenPro */}
      <Panel icon={Info} title="About ZenPro">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-sm shadow-primary/30">
              <ZenProMark className="h-5 w-5" />
            </span>
            <div>
              <p className="font-heading text-sm font-semibold">ZenPro</p>
              <p className="text-xs text-muted-foreground">
                Version {APP_VERSION} · Build {BUILD_DATE}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setAboutOpen(true)}>
            <Info className="h-4 w-4" />
            Learn more
          </Button>
        </div>
      </Panel>
    </div>
  );
}
