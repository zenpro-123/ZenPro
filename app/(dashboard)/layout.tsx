import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { AnimatedBackground } from "@/components/layout/AnimatedBackground";
import { CommandCenter } from "@/components/layout/CommandCenter";
import { UserHydrator } from "@/components/layout/UserHydrator";
import { SavedItemsHydrator } from "@/components/layout/SavedItemsHydrator";
import { Footer } from "@/components/layout/Footer";
import { AboutZenPro } from "@/components/shared/AboutZenPro";
import type { UserProfile, UserPreferences } from "@/types/user";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: UserProfile | null = null;
  let preferences: UserPreferences | null = null;
  let savedContentHashes: string[] = [];

  if (user) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profileRow?.onboarding_complete) redirect("/onboarding");

    const { data: prefsRow } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    profile = {
      id: profileRow.id,
      email: user.email ?? null,
      name: profileRow.name,
      avatarUrl: profileRow.avatar_url,
      onboardingComplete: profileRow.onboarding_complete,
      busyMode: profileRow.busy_mode,
      createdAt: profileRow.created_at,
    };

    preferences = prefsRow
      ? {
          userId: prefsRow.user_id,
          interests: prefsRow.interests ?? [],
          favoriteTopics: prefsRow.favorite_topics ?? [],
          favoriteCompanies: prefsRow.favorite_companies ?? [],
          favoriteCreators: prefsRow.favorite_creators ?? [],
          interestVector: prefsRow.interest_vector ?? {},
          updatedAt: prefsRow.updated_at,
        }
      : null;

    const { data: savedRows } = await supabase
      .from("saved_items")
      .select("content_items(content_hash)")
      .eq("user_id", user.id);

    savedContentHashes = (savedRows ?? [])
      .flatMap((row) => {
        const content = row.content_items as unknown as
          | { content_hash: string }
          | { content_hash: string }[]
          | null;
        if (!content) return [];
        return Array.isArray(content) ? content.map((c) => c.content_hash) : [content.content_hash];
      })
      .filter((hash): hash is string => Boolean(hash));
  }

  return (
    <div className="relative isolate min-h-screen bg-background">
      <AnimatedBackground />
      <UserHydrator profile={profile} preferences={preferences} />
      <SavedItemsHydrator savedContentHashes={savedContentHashes} />
      <CommandCenter />
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        <Footer />
      </div>
      <AboutZenPro />
    </div>
  );
}
