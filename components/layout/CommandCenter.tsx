"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useUIStore } from "@/stores/uiStore";
import { NAV_ITEMS } from "@/config/navigation";

interface SearchResult {
  id: string;
  source: string;
  category: string;
  title: string;
  summary: string | null;
  url: string | null;
  published_at: string | null;
}

/** Global CMD+K palette: quick navigation + search across aggregated content. */
export function CommandCenter() {
  const open = useUIStore((s) => s.commandCenterOpen);
  const setOpen = useUIStore((s) => s.setCommandCenterOpen);
  const router = useRouter();
  const [query, setQuery] = useState("");

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

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setQuery("");
  }

  const { data, isFetching } = useQuery({
    queryKey: ["search", query],
    queryFn: async (): Promise<{ results: SearchResult[] }> => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: query.trim().length >= 2,
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

  const results = data?.results ?? [];

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} title="Command Center">
      <CommandInput
        placeholder="Search content, jump to a page..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query.trim().length < 2 && (
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
        )}

        {query.trim().length >= 2 && (
          <>
            <CommandEmpty>
              {isFetching ? "Searching..." : "No results found."}
            </CommandEmpty>
            {results.length > 0 && (
              <CommandGroup heading="Content">
                {results.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => (result.url ? openUrl(result.url) : undefined)}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="truncate">{result.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
