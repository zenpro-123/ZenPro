"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Hash, Trash2, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
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

export function NoteDialog({ item, open, onOpenChange }: NoteDialogProps) {
  const [draft, setDraft] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
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
        body: JSON.stringify({ item, body, tags }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: () => {
      setDraft("");
      setTags([]);
      setTagInput("");
      trackEvent({ eventType: "note_create", itemId: item.contentHash });
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-notes"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-tags"] });
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
      queryClient.invalidateQueries({ queryKey: ["knowledge-notes"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-tags"] });
    },
  });

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }

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
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
                      >
                        <Hash className="h-2 w-2" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
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

        {/* Tags input */}
        <div className="space-y-2">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <Input
            placeholder="Add tags (press Enter)…"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTag}
            className="h-8 text-xs"
          />
        </div>

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
