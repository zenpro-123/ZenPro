"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  Building2,
  CalendarCheck,
  Copy,
  ExternalLink,
  FileText,
  GraduationCap,
  History,
  StickyNote,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUIStore } from "@/stores/uiStore";
import { NAV_ITEMS } from "@/config/navigation";
import type { SearchHit, SearchResultType } from "@/app/api/search/route";

const GROUPS: { type: SearchResultType; heading: string; icon: LucideIcon }[] = [
  { type: "content", heading: "Articles", icon: FileText },
  { type: "saved", heading: "Saved Items", icon: Bookmark },
  { type: "note", heading: "Notes", icon: StickyNote },
  { type: "opportunity", heading: "Opportunities", icon: Building2 },
  { type: "review", heading: "Weekly Reviews", icon: CalendarCheck },
  { type: "tool", heading: "Tools", icon: Wrench },
  { type: "learning", heading: "Learning", icon: GraduationCap },
  { type: "timeline", heading: "Timeline", icon: History },
];

export function CommandCenter() {
  const open = useUIStore((s) => s.commandCenterOpen);
  const setOpen = useUIStore((s) => s.setCommandCenterOpen);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!open);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  function handleQueryChange(value: string) {
    setQuery(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(value.trim()), 200);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setDebouncedQuery("");
      setCopiedId(null);
    }
  }

  const { data, isFetching } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: async (): Promise<{ results: SearchHit[] }> => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function openUrl(url: string) {
    setOpen(false);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function copyLink(hit: SearchHit) {
    const link = hit.url ?? hit.href ?? "";
    if (!link) return;
    const fullUrl = link.startsWith("/") ? `${window.location.origin}${link}` : link;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedId(hit.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function onSelect(hit: SearchHit) {
    if (hit.url) openUrl(hit.url);
    else if (hit.href) go(hit.href);
  }

  const results = data?.results ?? [];
  const hasResults = debouncedQuery.length >= 2;
  const resultCount = results.length;

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} title="Command Center">
      <CommandInput
        placeholder="Search everything — articles, notes, tools, timeline…"
        value={query}
        onValueChange={handleQueryChange}
      />
      <CommandList>
        {!hasResults && (
          <>
            <CommandGroup heading="Navigate">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem key={item.href} onSelect={() => go(item.href)}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              <CommandItem onSelect={() => go("/notes")}>
                <StickyNote className="h-4 w-4" />
                Create a note
              </CommandItem>
              <CommandItem onSelect={() => go("/saved")}>
                <Bookmark className="h-4 w-4" />
                View saved items
              </CommandItem>
              <CommandItem onSelect={() => go("/timeline")}>
                <History className="h-4 w-4" />
                Browse timeline
              </CommandItem>
              <CommandItem onSelect={() => go("/knowledge")}>
                <FileText className="h-4 w-4" />
                Knowledge workspace
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {hasResults && (
          <>
            <CommandEmpty>
              {isFetching ? "Searching…" : "No results found."}
            </CommandEmpty>

            {resultCount > 0 && !isFetching && (
              <div className="px-3 py-1.5">
                <span className="text-xs text-muted-foreground">
                  {resultCount} result{resultCount === 1 ? "" : "s"}
                </span>
              </div>
            )}

            {GROUPS.map(({ type, heading, icon: Icon }) => {
              const group = results.filter((r) => r.type === type);
              if (group.length === 0) return null;
              return (
                <CommandGroup key={type} heading={heading}>
                  {group.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={`${result.id}-${result.title}`}
                      onSelect={() => onSelect(result)}
                      className="group/item"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="truncate">{result.title}</span>
                        {result.subtitle && (
                          <span className="ml-2 truncate text-xs text-muted-foreground">
                            {result.subtitle}
                          </span>
                        )}
                      </div>
                      <div className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-data-[selected=true]/item:opacity-100">
                        {result.url && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openUrl(result.url!);
                            }}
                            className="rounded p-1 hover:bg-secondary"
                            title="Open"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                        {(result.url || result.href) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyLink(result);
                            }}
                            className="rounded p-1 hover:bg-secondary"
                            title={copiedId === result.id ? "Copied!" : "Copy link"}
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
