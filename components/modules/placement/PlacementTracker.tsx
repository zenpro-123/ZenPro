"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OpportunityDialog } from "@/components/modules/placement/OpportunityDialog";
import { useUserStore } from "@/stores/userStore";
import { isEnabled } from "@/config/features";
import { cn } from "@/lib/utils";
import {
  OPPORTUNITY_STATUSES,
  STATUS_LABELS,
  type OpportunityEntry,
  type OpportunityStatus,
} from "@/types/placement";

interface PlacementResponse {
  data: OpportunityEntry[];
}

async function fetchPlacement(): Promise<PlacementResponse> {
  const res = await fetch("/api/placement");
  if (!res.ok) throw new Error("Failed to load placement tracker");
  return res.json();
}

const STATUS_ACCENT: Record<OpportunityStatus, string> = {
  interested: "bg-muted-foreground/50",
  applied: "bg-primary",
  interviewing: "bg-warning",
  offer: "bg-positive",
  rejected: "bg-negative",
  archived: "bg-muted-foreground/30",
};

/** Phase 3B — manual job-application tracker (lightweight CRM, no scraping/AI). */
export function PlacementTracker() {
  const enabled = isEnabled("PLACEMENT_TRACKER");
  const profile = useUserStore((s) => s.profile);
  const hydrated = useUserStore((s) => s.hydrated);
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OpportunityEntry | undefined>(undefined);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["placement"],
    queryFn: fetchPlacement,
    enabled: enabled && !!profile,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OpportunityStatus }) =>
      fetch(`/api/placement/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update status");
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["placement"] }),
  });

  const deleteEntry = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/placement/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete");
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["placement"] }),
  });

  const grouped = useMemo(() => {
    const map = new Map<OpportunityStatus, OpportunityEntry[]>();
    for (const status of OPPORTUNITY_STATUSES) map.set(status, []);
    for (const entry of data?.data ?? []) map.get(entry.status)?.push(entry);
    return map;
  }, [data]);

  if (!enabled) return null;

  if (hydrated && !profile) {
    return (
      <GlassCard
        strong
        className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Placement Tracker
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to track your job and internship applications.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/login">Sign in</Link>
        </Button>
      </GlassCard>
    );
  }

  const total = data?.data.length ?? 0;

  return (
    <section className="space-y-6">
      <SectionHeader
        icon={Building2}
        eyebrow="Placement"
        title="Placement Tracker"
        subtitle="Your applications, from interested to offer"
        actions={
          <Button
            type="button"
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        }
      />

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      )}

      {isError && (
        <EmptyState
          icon={Building2}
          title="Couldn't load your tracker"
          description="Please try again in a moment."
        />
      )}

      {!isLoading && !isError && total === 0 && (
        <EmptyState
          icon={Building2}
          title="No opportunities yet"
          description="Add your first application to start tracking your pipeline."
          action={
            <Button
              type="button"
              onClick={() => {
                setEditing(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add opportunity
            </Button>
          }
        />
      )}

      {!isLoading && !isError && total > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {OPPORTUNITY_STATUSES.map((status) => {
            const entries = grouped.get(status) ?? [];
            return (
              <div key={status} className="w-72 shrink-0 space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className={cn("h-2 w-2 rounded-full", STATUS_ACCENT[status])} />
                  <h3 className="text-sm font-semibold">{STATUS_LABELS[status]}</h3>
                  <span className="text-xs text-muted-foreground">{entries.length}</span>
                </div>

                <div className="space-y-2.5">
                  {entries.map((entry) => (
                    <GlassCard key={entry.id} className="space-y-2 p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        {entry.url ? (
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/link flex items-start gap-1 text-sm font-semibold leading-snug transition-colors hover:text-primary"
                          >
                            {entry.title}
                            <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground transition-colors group-hover/link:text-primary" />
                          </a>
                        ) : (
                          <span className="text-sm font-semibold leading-snug">{entry.title}</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        {entry.company && <span>{entry.company}</span>}
                        {entry.opportunityType && (
                          <Badge variant="secondary">{entry.opportunityType}</Badge>
                        )}
                      </div>

                      {entry.notes && (
                        <p className="line-clamp-2 text-xs text-muted-foreground/80">{entry.notes}</p>
                      )}

                      <div className="flex items-center gap-1 pt-0.5">
                        <Select
                          value={entry.status}
                          onValueChange={(v) =>
                            updateStatus.mutate({ id: entry.id, status: v as OpportunityStatus })
                          }
                        >
                          <SelectTrigger className="h-7 flex-1 text-xs">
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit opportunity"
                          onClick={() => {
                            setEditing(entry);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete opportunity"
                          onClick={() => deleteEntry.mutate(entry.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </GlassCard>
                  ))}

                  {entries.length === 0 && (
                    <p className="rounded-xl border border-dashed border-border/50 px-3 py-4 text-center text-xs text-muted-foreground/60">
                      Nothing here yet
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <OpportunityDialog open={dialogOpen} onOpenChange={setDialogOpen} entry={editing} />
    </section>
  );
}
