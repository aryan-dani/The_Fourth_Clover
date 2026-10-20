"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchContentAction } from "@/features/data/search-actions";

type SearchHit = {
  id: string;
  title: string;
  slug: string;
  kind: "journal" | "tech";
  excerpt?: string | null;
};

export function SearchPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHits([]);
      setLoading(false);
    }
  }, [open]);

  const runSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    setLoading(true);
    try {
      const res = await searchContentAction(q.trim(), 12);
      setHits(res.hits || []);
    } catch {
      setHits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const go = (hit: SearchHit) => {
    onOpenChange(false);
    router.push(
      hit.kind === "tech" ? `/tech-weekly/${hit.slug}` : `/post/${hit.slug}`,
    );
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search journal & Tech Weekly…"
        value={query}
        onValueChange={(v) => void runSearch(v)}
      />
      <CommandList>
        <CommandEmpty>
          {loading
            ? "Searching…"
            : query.trim().length < 2
              ? "Start typing to search the publication"
              : "No matching pieces"}
        </CommandEmpty>
        {hits.length > 0 && (
          <CommandGroup heading="Results">
            {hits.map((hit) => (
              <CommandItem
                key={`${hit.kind}-${hit.id}`}
                value={`${hit.title} ${hit.slug}`}
                onSelect={() => go(hit)}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-medium leading-snug">
                    {hit.title}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {hit.kind === "tech" ? "Tech Weekly" : "Journal"}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
