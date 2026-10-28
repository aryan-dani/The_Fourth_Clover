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
import {
  searchContentAction,
  type SearchHit,
} from "@/features/data/search-actions";

function kindLabel(kind: SearchHit["kind"]) {
  if (kind === "tech") return "Tech Weekly";
  if (kind === "author") return "Author";
  return "Journal";
}

function hrefFor(hit: SearchHit) {
  if (hit.kind === "author") return `/profile/${hit.slug}`;
  if (hit.kind === "tech") return `/tech-weekly/${hit.slug}`;
  return `/post/${hit.slug}`;
}

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
    router.push(hrefFor(hit));
  };

  const authors = hits.filter((h) => h.kind === "author");
  const pieces = hits.filter((h) => h.kind !== "author");

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search titles, excerpts, and authors…"
        value={query}
        onValueChange={(v) => void runSearch(v)}
      />
      <CommandList>
        <CommandEmpty>
          {loading
            ? "Searching…"
            : query.trim().length < 2
              ? "Start typing to search the publication"
              : "No matching pieces or authors"}
        </CommandEmpty>
        {authors.length > 0 && (
          <CommandGroup heading="Authors">
            {authors.map((hit) => (
              <CommandItem
                key={`author-${hit.id}`}
                value={`${hit.title} ${hit.slug} author`}
                onSelect={() => go(hit)}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-medium leading-snug">
                    {hit.title}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    @{hit.slug} · Author
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {pieces.length > 0 && (
          <CommandGroup heading="Pieces">
            {pieces.map((hit) => (
              <CommandItem
                key={`${hit.kind}-${hit.id}`}
                value={`${hit.title} ${hit.slug} ${hit.kind}`}
                onSelect={() => go(hit)}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-medium leading-snug">
                    {hit.title}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {kindLabel(hit.kind)}
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
