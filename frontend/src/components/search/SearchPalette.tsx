"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Newspaper,
  Tags,
  UserRound,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
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

const QUICK_LINKS = [
  {
    href: "/journal",
    label: "Browse the Journal",
    hint: "Essays & verse",
    icon: BookOpen,
  },
  {
    href: "/tech-weekly",
    label: "This week’s Tech Weekly",
    hint: "CSI dispatches",
    icon: Newspaper,
  },
  {
    href: "/tags",
    label: "Explore topics",
    hint: "Browse by tag",
    icon: Tags,
  },
] as const;

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

function HitRow({ hit }: { hit: SearchHit }) {
  const isAuthor = hit.kind === "author";
  return (
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--fg-line)] text-[var(--brand-color)]"
        aria-hidden
      >
        {isAuthor ? (
          <UserRound className="h-3.5 w-3.5" strokeWidth={1.75} />
        ) : hit.kind === "tech" ? (
          <Newspaper className="h-3.5 w-3.5" strokeWidth={1.75} />
        ) : (
          <BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
        )}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate font-medium leading-snug text-foreground">
            {hit.title}
          </span>
          <span className="type-label shrink-0 text-[0.65rem] text-muted-foreground">
            {kindLabel(hit.kind)}
          </span>
        </div>
        <p className="line-clamp-1 text-xs leading-relaxed text-muted-foreground">
          {isAuthor
            ? `@${hit.slug}${hit.excerpt ? ` · ${hit.excerpt}` : ""}`
            : hit.excerpt?.trim() || "Open piece"}
        </p>
      </div>
    </div>
  );
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
  const debounceRef = useRef<number | null>(null);
  const requestId = useRef(0);

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
      if (debounceRef.current != null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (debounceRef.current != null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const runSearch = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current != null) {
      window.clearTimeout(debounceRef.current);
    }

    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const id = ++requestId.current;
    debounceRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await searchContentAction(trimmed, 16);
          if (id !== requestId.current) return;
          setHits(res.hits || []);
        } catch {
          if (id !== requestId.current) return;
          setHits([]);
        } finally {
          if (id === requestId.current) setLoading(false);
        }
      })();
    }, 220);
  }, []);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const authors = hits.filter((h) => h.kind === "author");
  const journal = hits.filter((h) => h.kind === "journal");
  const tech = hits.filter((h) => h.kind === "tech");
  const hasQuery = query.trim().length >= 2;
  const showEmptyPrompt = !hasQuery && !loading;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search Journal, Tech Weekly, and authors…"
        value={query}
        onValueChange={runSearch}
      />
      <CommandList>
        {showEmptyPrompt ? (
          <CommandGroup heading="Go to">
            {QUICK_LINKS.map((link) => (
              <CommandItem
                key={link.href}
                value={`${link.label} ${link.hint}`}
                onSelect={() => go(link.href)}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--fg-line)] text-[var(--brand-color)]"
                  aria-hidden
                >
                  <link.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{link.label}</p>
                  <p className="type-label mt-0.5 text-[0.65rem] text-muted-foreground">
                    {link.hint}
                  </p>
                </div>
                <ArrowUpRight
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </CommandItem>
            ))}
          </CommandGroup>
        ) : (
          <>
            <CommandEmpty>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Searching the publication…
                </span>
              ) : (
                `No matches for “${query.trim()}”`
              )}
            </CommandEmpty>

            {authors.length > 0 && (
              <CommandGroup heading="Authors">
                {authors.map((hit) => (
                  <CommandItem
                    key={`author-${hit.id}`}
                    value={`${hit.title} ${hit.slug} author`}
                    onSelect={() => go(hrefFor(hit))}
                  >
                    <HitRow hit={hit} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {journal.length > 0 && (
              <CommandGroup heading="Journal">
                {journal.map((hit) => (
                  <CommandItem
                    key={`journal-${hit.id}`}
                    value={`${hit.title} ${hit.slug} journal`}
                    onSelect={() => go(hrefFor(hit))}
                  >
                    <HitRow hit={hit} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {tech.length > 0 && (
              <CommandGroup heading="Tech Weekly">
                {tech.map((hit) => (
                  <CommandItem
                    key={`tech-${hit.id}`}
                    value={`${hit.title} ${hit.slug} tech`}
                    onSelect={() => go(hrefFor(hit))}
                  >
                    <HitRow hit={hit} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--fg-line)] px-4 py-2.5">
        <p className="type-label text-[0.65rem] text-muted-foreground">
          <kbd className="mr-1 border border-[var(--fg-line)] px-1 py-px font-mono">
            ↑↓
          </kbd>
          navigate
          <span className="mx-2 opacity-40">·</span>
          <kbd className="mr-1 border border-[var(--fg-line)] px-1 py-px font-mono">
            ↵
          </kbd>
          open
        </p>
        {hasQuery ? (
          <button
            type="button"
            className="type-label text-[0.65rem] text-[var(--brand-color)] transition-opacity hover:opacity-70"
            onClick={() =>
              go(`/search?q=${encodeURIComponent(query.trim())}`)
            }
          >
            View all results →
          </button>
        ) : (
          <span className="type-label text-[0.65rem] text-muted-foreground">
            ⌘K / Ctrl+K
          </span>
        )}
      </div>
    </CommandDialog>
  );
}
