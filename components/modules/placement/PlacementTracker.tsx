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

const STATUS_ORDER: Record<OpportunityStatus, number> = OPPORTUNITY_STATUSES.reduce(
  (acc, status, i) => ({ ...acc, [status]: i }),
  {} as Record<OpportunityStatus, number>
);

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

  const entries = useMemo(() => {
    return [...(data?.data ?? [])].sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
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

      {isLoading && <Skeleton className="h-64 w-full rounded-2xl" />}

      {isError && (
        <EmptyState
          icon={Building2}
          title="Couldn't load your tracker"
          description="Please try again in a moment."
        />
      )}

      {!isLoading && !isError && entries.length === 0 && (
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

      {!isLoading && !isError && entries.length > 0 && (
        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/50 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-center">Role</th>
                  <th className="px-4 py-3 text-center">Company</th>
                  <th className="px-4 py-3 text-center">Type</th>
                  <th className="px-4 py-3 text-center">Notes</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border/30 align-middle transition-colors last:border-0 hover:bg-foreground/[0.02]"
                  >
                    <td className="px-4 py-3 text-center font-medium">
                      {entry.url ? (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/link inline-flex items-center justify-center gap-1 transition-colors hover:text-primary"
                        >
                          {entry.title}
                          <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground transition-colors group-hover/link:text-primary" />
                        </a>
                      ) : (
                        entry.title
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {entry.company || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.opportunityType ? (
                        <Badge variant="secondary">{entry.opportunityType}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-center text-xs text-muted-foreground/80">
                      <span className="line-clamp-2">{entry.notes || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Select
                        value={entry.status}
                        onValueChange={(v) =>
                          updateStatus.mutate({ id: entry.id, status: v as OpportunityStatus })
                        }
                      >
                        <SelectTrigger className="mx-auto h-8 w-36 text-xs">
                          <span className="flex items-center gap-1.5">
                            <span
                              className={cn("h-1.5 w-1.5 rounded-full", STATUS_ACCENT[entry.status])}
                            />
                            <SelectValue />
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {OPPORTUNITY_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-0.5">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <OpportunityDialog open={dialogOpen} onOpenChange={setDialogOpen} entry={editing} />
    </section>
  );
}
