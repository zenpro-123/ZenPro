"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/shared/SaveButton";
import { NoteDialog } from "@/components/modules/notes/NoteDialog";
import { useUserStore } from "@/stores/userStore";
import { isEnabled } from "@/config/features";
import { cn } from "@/lib/utils";
import type { SaveItemPayload } from "@/types/saved";

interface CardActionsProps {
  item: SaveItemPayload;
  className?: string;
}

/** Composite save/notes controls for content cards — wraps SaveButton and the notes dialog trigger. */
export function CardActions({ item, className }: CardActionsProps) {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <SaveButton item={item} />
      {isEnabled("KNOWLEDGE_NOTES") && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Open notes"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!profile) {
                router.push("/login");
                return;
              }
              setNotesOpen(true);
            }}
          >
            <StickyNote className="h-4 w-4" />
          </Button>
          {profile && <NoteDialog item={item} open={notesOpen} onOpenChange={setNotesOpen} />}
        </>
      )}
    </div>
  );
}
