"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Check,
  Hash,
  Link2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/utils/formatting";
import { useTrackEvent } from "@/lib/events/useTrackEvent";
import type { NoteWithTarget, Backlink } from "@/types/notes";

interface KnowledgeNoteCardProps {
  note: NoteWithTarget;
}

async function fetchBacklinks(noteId: string): Promise<{ backlinks: Backlink[] }> {
  const res = await fetch(`/api/knowledge/links?noteId=${noteId}`);
  if (!res.ok) return { backlinks: [] };
  return res.json();
}

export function KnowledgeNoteCard({ note }: KnowledgeNoteCardProps) {
  const queryClient = useQueryClient();
  const trackEvent = useTrackEvent();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.body);
  const [tagInput, setTagInput] = useState("");
  const [editTags, setEditTags] = useState<string[]>(note.tags);
  const [showBacklinks, setShowBacklinks] = useState(false);

  const { data: backlinksData } = useQuery({
    queryKey: ["backlinks", note.id],
    queryFn: () => fetchBacklinks(note.id),
    enabled: showBacklinks,
    staleTime: 60_000,
  });

  const backlinks = backlinksData?.backlinks ?? [];

  const updateNote = useMutation({
    mutationFn: async (payload: { body: string; tags: string[] }) => {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update note");
    },
    onSuccess: () => {
      setEditing(false);
      trackEvent({ eventType: "note_update", itemId: note.id });
      queryClient.invalidateQueries({ queryKey: ["knowledge-notes"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-tags"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
    },
    onSuccess: () => {
      trackEvent({ eventType: "note_delete", itemId: note.id });
      queryClient.invalidateQueries({ queryKey: ["knowledge-notes"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-tags"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setEditTags(editTags.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }

  return (
    <GlassCard className="flex h-full flex-col gap-3 p-5">
      {/* Header with linked content */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {note.target.url ? (
            <a
              href={note.target.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-1.5"
            >
              <h3 className="text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                {note.target.title}
              </h3>
              <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </a>
          ) : (
            <h3 className="text-sm font-medium leading-snug text-foreground">
              {note.target.title}
            </h3>
          )}
          {note.target.category && (
            <Badge variant="secondary" className="mt-1 text-[10px]">
              {note.target.category}
            </Badge>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {editing ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Save note"
                disabled={!draft.trim() || updateNote.isPending}
                onClick={() => updateNote.mutate({ body: draft.trim(), tags: editTags })}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Cancel edit"
                onClick={() => {
                  setDraft(note.body);
                  setEditTags(note.tags);
                  setEditing(false);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Edit note"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Delete note"
                onClick={() => deleteNote.mutate()}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      {editing ? (
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} autoFocus />
      ) : (
        <p className="line-clamp-[8] text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {note.body}
        </p>
      )}

      {/* Tags */}
      {editing ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {editTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
          <Input
            placeholder="Add tag (press Enter)…"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTag}
            className="h-8 text-xs"
          />
        </div>
      ) : (
        note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                <Hash className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )
      )}

      {/* Backlinks toggle */}
      {note.contentItemId && !editing && (
        <button
          type="button"
          onClick={() => setShowBacklinks((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Link2 className="h-3 w-3" />
          {showBacklinks ? "Hide" : "Show"} related notes
        </button>
      )}

      {/* Backlinks */}
      {showBacklinks && backlinks.length > 0 && (
        <div className="space-y-1.5 rounded-lg border border-border/50 bg-muted/20 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Referenced By
          </div>
          {backlinks.map((bl) => (
            <div key={bl.noteId} className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{bl.sourceTitle}</span>
              <span className="ml-1">— {bl.noteBody}</span>
            </div>
          ))}
        </div>
      )}

      {showBacklinks && backlinks.length === 0 && (
        <p className="text-xs text-muted-foreground/60">No related notes found.</p>
      )}

      <p className="mt-auto text-xs text-muted-foreground/70">
        {formatRelativeTime(note.updatedAt)}
      </p>
    </GlassCard>
  );
}
