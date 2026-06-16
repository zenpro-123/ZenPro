"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { StickyNote } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { CardGridSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { NoteCard } from "@/components/modules/notes/NoteCard";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { useUserStore } from "@/stores/userStore";
import { isEnabled } from "@/config/features";
import type { NoteWithTarget } from "@/types/notes";

interface NotesResponse {
  data: NoteWithTarget[];
}

async function fetchNotes(): Promise<NotesResponse> {
  const res = await fetch("/api/notes");
  if (!res.ok) throw new Error("Failed to load notes");
  return res.json();
}

/** Module — Knowledge Notes Hub: all personal annotations across saved content. */
export function KnowledgeNotesHub() {
  const enabled = isEnabled("KNOWLEDGE_NOTES");
  const profile = useUserStore((s) => s.profile);
  const hydrated = useUserStore((s) => s.hydrated);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notes"],
    queryFn: fetchNotes,
    enabled: enabled && !!profile,
  });

  if (!enabled) return null;

  if (hydrated && !profile) {
    return (
      <GlassCard
        strong
        className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Knowledge Notes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to jot down notes on articles, repos, and opportunities.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/login">Sign in</Link>
        </Button>
      </GlassCard>
    );
  }

  const notes = data?.data ?? [];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Knowledge Notes</h2>
        <p className="text-sm text-muted-foreground">Your annotations across everything you&apos;ve read</p>
      </div>

      {isLoading && <CardGridSkeleton count={4} />}

      {!isLoading && (isError || notes.length === 0) && (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Open the notes icon on any card to jot something down."
        />
      )}

      {notes.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {notes.map((note) => (
            <motion.div key={note.id} variants={staggerItem}>
              <NoteCard note={note} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
