"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTrackEvent } from "@/lib/events/useTrackEvent";
import { formatRelativeTime } from "@/lib/utils/formatting";
import type { SaveItemPayload } from "@/types/saved";
import type { NoteWithTarget } from "@/types/notes";

interface NoteDialogProps {
  item: SaveItemPayload;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NotesResponse {
  data: NoteWithTarget[];
}

async function fetchNotes(contentHash: string): Promise<NotesResponse> {
  const res = await fetch(`/api/notes?contentHash=${encodeURIComponent(contentHash)}`);
  if (!res.ok) throw new Error("Failed to load notes");
  return res.json();
}

/** Dialog for viewing and adding notes attached to a content item, opened from CardActions. */
export function NoteDialog({ item, open, onOpenChange }: NoteDialogProps) {
  const [draft, setDraft] = useState("");
  const queryClient = useQueryClient();
  const trackEvent = useTrackEvent();
  const queryKey = ["notes", item.contentHash];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchNotes(item.contentHash),
    enabled: open,
  });

  const addNote = useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, body }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: () => {
      setDraft("");
      trackEvent({ eventType: "note_create", itemId: item.contentHash });
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
    },
    onSuccess: (_data, id) => {
      trackEvent({ eventType: "note_delete", itemId: id });
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const notes = data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notes</DialogTitle>
          <DialogDescription className="line-clamp-1">{item.title}</DialogDescription>
        </DialogHeader>

        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {isLoading && <p className="text-sm text-muted-foreground">Loading notes…</p>}

          {!isLoading && notes.length === 0 && (
            <p className="text-sm text-muted-foreground">No notes yet — add one below.</p>
          )}

          {notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start justify-between gap-2 rounded-lg border border-border/50 bg-muted/30 p-3"
            >
              <div className="flex-1 space-y-1">
                <p className="text-sm whitespace-pre-wrap">{note.body}</p>
                <p className="text-xs text-muted-foreground/70">{formatRelativeTime(note.updatedAt)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Delete note"
                onClick={() => deleteNote.mutate(note.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <Textarea
          placeholder="Add a note…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
        />

        <DialogFooter>
          <Button
            type="button"
            disabled={!draft.trim() || addNote.isPending}
            onClick={() => addNote.mutate(draft.trim())}
          >
            Add note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
