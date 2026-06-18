"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Hash, Pencil, Trash2, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/utils/formatting";
import { useTrackEvent } from "@/lib/events/useTrackEvent";
import type { NoteWithTarget } from "@/types/notes";

interface NoteCardProps {
  note: NoteWithTarget;
}

export function NoteCard({ note }: NoteCardProps) {
  const queryClient = useQueryClient();
  const trackEvent = useTrackEvent();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.body);
  const [tagInput, setTagInput] = useState("");
  const [editTags, setEditTags] = useState<string[]>(note.tags);

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
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-notes"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-tags"] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
    },
    onSuccess: () => {
      trackEvent({ eventType: "note_delete", itemId: note.id });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-notes"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-tags"] });
    },
  });

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
    }
    setTagInput("");
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }

  return (
    <GlassCard className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
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
          <h3 className="text-sm font-medium leading-snug text-foreground">{note.target.title}</h3>
        )}
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

      {editing ? (
        <>
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} autoFocus />
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
                    onClick={() => setEditTags(editTags.filter((t) => t !== tag))}
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
        </>
      ) : (
        <>
          <p className="line-clamp-[8] text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {note.body}
          </p>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                >
                  <Hash className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      <p className="mt-auto text-xs text-muted-foreground/70">{formatRelativeTime(note.updatedAt)}</p>
    </GlassCard>
  );
}
