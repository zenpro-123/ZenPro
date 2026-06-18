"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BookOpen,
  Hash,
  Link2,
  Search,
  StickyNote,
  X,
} from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardGridSkeleton } from "@/components/shared/SkeletonLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KnowledgeNoteCard } from "@/components/modules/knowledge/KnowledgeNoteCard";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { useUserStore } from "@/stores/userStore";
import { cn } from "@/lib/utils";
import type { NoteWithTarget } from "@/types/notes";
import Link from "next/link";

interface NotesResponse {
  data: NoteWithTarget[];
}

interface TagEntry {
  name: string;
  count: number;
}

async function fetchNotes(opts: { tag?: string; search?: string }): Promise<NotesResponse> {
  const params = new URLSearchParams();
  if (opts.tag) params.set("tag", opts.tag);
  if (opts.search && opts.search.length >= 2) params.set("q", opts.search);
  const qs = params.toString();
  const res = await fetch(`/api/notes${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to load notes");
  return res.json();
}

async function fetchTags(): Promise<{ tags: TagEntry[] }> {
  const res = await fetch("/api/knowledge/tags");
  if (!res.ok) throw new Error("Failed to load tags");
  return res.json();
}

export function KnowledgeWorkspace() {
  const profile = useUserStore((s) => s.profile);
  const hydrated = useUserStore((s) => s.hydrated);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout>>();

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => setDebouncedSearch(value.trim()), 300));
  }

  const { data: tagsData } = useQuery({
    queryKey: ["knowledge-tags"],
    queryFn: fetchTags,
    enabled: !!profile,
    staleTime: 60_000,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["knowledge-notes", activeTag, debouncedSearch],
    queryFn: () => fetchNotes({ tag: activeTag ?? undefined, search: debouncedSearch || undefined }),
    enabled: !!profile,
  });

  if (hydrated && !profile) {
    return (
      <GlassCard
        strong
        className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Knowledge Workspace
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to build your personal knowledge system.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/login">Sign in</Link>
        </Button>
      </GlassCard>
    );
  }

  const notes = data?.data ?? [];
  const tags = tagsData?.tags ?? [];
  const hasFilters = activeTag || debouncedSearch;

  const linkedNotes = notes.filter((n) => n.contentItemId);
  const standaloneNotes = notes.filter((n) => !n.contentItemId);

  const categoryGroups = new Map<string, NoteWithTarget[]>();
  for (const note of linkedNotes) {
    const cat = note.target.category ?? "other";
    const existing = categoryGroups.get(cat) ?? [];
    existing.push(note);
    categoryGroups.set(cat, existing);
  }

  return (
    <section className="space-y-8">
      <SectionHeader
        icon={BookOpen}
        eyebrow="Knowledge"
        title="Knowledge Workspace"
        subtitle="Your personal knowledge system — notes, tags, and connections across ZenPro."
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search notes, tags, content…"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 glass"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-sm font-semibold tracking-tight">Tags</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.name}
                type="button"
                onClick={() => setActiveTag(activeTag === tag.name ? null : tag.name)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTag === tag.name
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                #{tag.name}
                <span className="text-[10px] opacity-70">{tag.count}</span>
              </button>
            ))}
            {activeTag && (
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats Bar */}
      {!isLoading && notes.length > 0 && (
        <div className="flex flex-wrap gap-4">
          <GlassCard static className="flex items-center gap-3 px-4 py-3">
            <StickyNote className="h-4 w-4 text-primary" />
            <div>
              <div className="text-lg font-semibold">{notes.length}</div>
              <div className="text-xs text-muted-foreground">Notes</div>
            </div>
          </GlassCard>
          <GlassCard static className="flex items-center gap-3 px-4 py-3">
            <Hash className="h-4 w-4 text-primary" />
            <div>
              <div className="text-lg font-semibold">{tags.length}</div>
              <div className="text-xs text-muted-foreground">Tags</div>
            </div>
          </GlassCard>
          <GlassCard static className="flex items-center gap-3 px-4 py-3">
            <Link2 className="h-4 w-4 text-primary" />
            <div>
              <div className="text-lg font-semibold">{linkedNotes.length}</div>
              <div className="text-xs text-muted-foreground">Linked</div>
            </div>
          </GlassCard>
        </div>
      )}

      {isLoading && <CardGridSkeleton count={6} />}

      {!isLoading && (isError || notes.length === 0) && (
        <EmptyState
          icon={BookOpen}
          title={hasFilters ? "No matching notes" : "Start building your knowledge"}
          description={
            hasFilters
              ? "Try adjusting your search or tag filters."
              : "Open the notes icon on any card to capture your thoughts. They'll appear here as your personal knowledge base."
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveTag(null);
                  handleSearchChange("");
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Linked Notes by Category */}
      {[...categoryGroups.entries()].map(([category, categoryNotes]) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-sm font-semibold capitalize tracking-tight">
              {category === "other" ? "General" : category} notes
            </h3>
            <Badge variant="secondary" className="text-xs">
              {categoryNotes.length}
            </Badge>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {categoryNotes.map((note) => (
              <motion.div key={note.id} variants={staggerItem} className="h-full">
                <KnowledgeNoteCard note={note} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      ))}

      {/* Standalone Notes */}
      {standaloneNotes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-sm font-semibold tracking-tight">Standalone Notes</h3>
            <Badge variant="secondary" className="text-xs">
              {standaloneNotes.length}
            </Badge>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {standaloneNotes.map((note) => (
              <motion.div key={note.id} variants={staggerItem} className="h-full">
                <KnowledgeNoteCard note={note} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </section>
  );
}
