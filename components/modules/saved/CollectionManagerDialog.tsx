"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTrackEvent } from "@/lib/events/useTrackEvent";
import type { Collection } from "@/types/saved";

interface CollectionManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: Collection[];
}

async function postJson(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Request failed");
  }
}

/** Dialog for creating, renaming, and deleting collections from the Saved Items Hub. */
export function CollectionManagerDialog({ open, onOpenChange, collections }: CollectionManagerDialogProps) {
  const queryClient = useQueryClient();
  const trackEvent = useTrackEvent();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["collections"] });
    queryClient.invalidateQueries({ queryKey: ["saved-items"] });
  }

  const createCollection = useMutation({
    mutationFn: (name: string) => postJson("/api/collections", "POST", { name }),
    onSuccess: () => {
      setNewName("");
      trackEvent({ eventType: "collection_create" });
      invalidate();
    },
  });

  const renameCollection = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      postJson(`/api/collections/${id}`, "PATCH", { name }),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
  });

  const deleteCollection = useMutation({
    mutationFn: (id: string) => postJson(`/api/collections/${id}`, "DELETE"),
    onSuccess: invalidate,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Collections</DialogTitle>
          <DialogDescription>Organize your saved items into collections.</DialogDescription>
        </DialogHeader>

        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {collections.length === 0 && (
            <p className="text-sm text-muted-foreground">No collections yet — create one below.</p>
          )}

          {collections.map((collection) => (
            <div
              key={collection.id}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 p-2"
            >
              {editingId === collection.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-7 flex-1"
                    maxLength={60}
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Save name"
                    disabled={!editingName.trim()}
                    onClick={() => renameCollection.mutate({ id: collection.id, name: editingName.trim() })}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-sm">{collection.name}</span>
                  <span className="text-xs text-muted-foreground">{collection.itemCount}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Rename collection"
                    onClick={() => {
                      setEditingId(collection.id);
                      setEditingName(collection.name);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Delete collection"
                onClick={() => deleteCollection.mutate(collection.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="New collection name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={60}
          />
          <Button
            type="button"
            disabled={!newName.trim() || createCollection.isPending}
            onClick={() => createCollection.mutate(newName.trim())}
          >
            Create
          </Button>
        </div>

        {createCollection.isError && (
          <p className="text-xs text-destructive">{(createCollection.error as Error).message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
