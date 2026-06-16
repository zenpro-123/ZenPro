"use client";

import { useState } from "react";
import { ArrowUpRight, Pencil, Trash2, Check, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

  const updateNote = useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error("Failed to update note");
    },
    onSuccess: () => {
      setEditing(false);
      trackEvent({ eventType: "note_update", itemId: note.id });
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
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

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
                onClick={() => updateNote.mutate(draft.trim())}
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
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} autoFocus />
      ) : (
        <p className="line-clamp-[8] text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {note.body}
        </p>
      )}

      <p className="mt-auto text-xs text-muted-foreground/70">{formatRelativeTime(note.updatedAt)}</p>
    </GlassCard>
  );
}
