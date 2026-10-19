"use client";

import { useCallback, useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ShareMenuProps = {
  title?: string;
  url?: string;
  className?: string;
};

function shareUrl(url: string | undefined): string {
  if (url) return url;
  if (typeof window !== "undefined") return window.location.href;
  return "";
}

export function ShareMenu({ title, url, className }: ShareMenuProps) {
  const [copied, setCopied] = useState(false);

  const resolveUrl = useCallback(() => shareUrl(url), [url]);

  const handleCopy = useCallback(async () => {
    const href = resolveUrl();
    if (!href) return;
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  }, [resolveUrl]);

  const handleTwitter = useCallback(() => {
    const href = resolveUrl();
    const text = title?.trim() || document.title;
    const intent = new URL("https://twitter.com/intent/tweet");
    intent.searchParams.set("url", href);
    intent.searchParams.set("text", text);
    window.open(intent.toString(), "_blank", "noopener,noreferrer");
  }, [resolveUrl, title]);

  const handleWhatsApp = useCallback(() => {
    const href = resolveUrl();
    const text = title?.trim()
      ? `${title.trim()} ${href}`
      : href;
    const wa = new URL("https://wa.me/");
    wa.searchParams.set("text", text);
    window.open(wa.toString(), "_blank", "noopener,noreferrer");
  }, [resolveUrl, title]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("border-hairline gap-2", className)}
          aria-label="Share"
        >
          <Share2 className="h-3.5 w-3.5" aria-hidden />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        <DropdownMenuItem onSelect={() => void handleCopy()}>
          {copied ? (
            <Check className="mr-2 h-3.5 w-3.5 text-brand" aria-hidden />
          ) : (
            <Link2 className="mr-2 h-3.5 w-3.5" aria-hidden />
          )}
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleTwitter}>
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleWhatsApp}>
          WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
