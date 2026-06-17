"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  OPPORTUNITY_STATUSES,
  STATUS_LABELS,
  type OpportunityEntry,
  type OpportunityInput,
  type OpportunityStatus,
} from "@/types/placement";

interface OpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog edits this entry; otherwise it creates a new one. */
  entry?: OpportunityEntry;
}

async function saveOpportunity(input: OpportunityInput, id?: string) {
  const res = await fetch(id ? `/api/placement/${id}` : "/api/placement", {
    method: id ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Request failed");
  }
}

const EMPTY: OpportunityInput = {
  title: "",
  company: "",
  url: "",
  opportunityType: "",
  status: "interested",
  notes: "",
};

/** Create/edit form for a tracked opportunity. */
export function OpportunityDialog({ open, onOpenChange, entry }: OpportunityDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<OpportunityInput>(EMPTY);

  // Reset the form to the target entry (or blank) each time the dialog opens —
  // the React-endorsed "adjust state during render" pattern (no effect).
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(
        entry
          ? {
              title: entry.title,
              company: entry.company ?? "",
              url: entry.url ?? "",
              opportunityType: entry.opportunityType ?? "",
              status: entry.status,
              notes: entry.notes ?? "",
            }
          : EMPTY
      );
    }
  }

  const mutation = useMutation({
    mutationFn: () => saveOpportunity({ ...form, title: form.title.trim() }, entry?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["placement"] });
      onOpenChange(false);
    },
  });

  function set<K extends keyof OpportunityInput>(key: K, value: OpportunityInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit opportunity" : "Add opportunity"}</DialogTitle>
          <DialogDescription>
            Track a role manually — no scraping, no AI, fully under your control.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="opp-title">Role / Title</Label>
            <Input
              id="opp-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Software Engineer Intern"
              maxLength={200}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="opp-company">Company</Label>
              <Input
                id="opp-company"
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Acme Inc."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opp-type">Type</Label>
              <Input
                id="opp-type"
                value={form.opportunityType}
                onChange={(e) => set("opportunityType", e.target.value)}
                placeholder="Internship"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="opp-url">Link</Label>
            <Input
              id="opp-url"
              type="url"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="opp-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => set("status", v as OpportunityStatus)}
            >
              <SelectTrigger id="opp-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPPORTUNITY_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="opp-notes">Notes</Label>
            <Textarea
              id="opp-notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Referral from…, interview on…, etc."
              rows={3}
            />
          </div>

          {mutation.isError && (
            <p className="text-xs text-destructive">{(mutation.error as Error).message}</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!form.title.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {entry ? "Save changes" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
