"use client";

import { ImagePlus, Loader2, Settings2, Trash2 } from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type PostFormatOption = "prose" | "poetry";

type EditorSettingsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coverImage?: string;
  onCoverFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearCover?: () => void;
  isUploadingCover?: boolean;
  tags: string;
  onTagsChange: (value: string) => void;
  excerpt?: string;
  onExcerptChange?: (value: string) => void;
  slug?: string;
  onSlugChange?: (value: string) => void;
  showExcerpt?: boolean;
  showSlug?: boolean;
  /** Journal-only: prose | poetry */
  showFormat?: boolean;
  format?: PostFormatOption;
  onFormatChange?: (value: PostFormatOption) => void;
  triggerLabel?: string;
};

export function EditorSettingsSheet({
  open,
  onOpenChange,
  coverImage,
  onCoverFileChange,
  onClearCover,
  isUploadingCover = false,
  tags,
  onTagsChange,
  excerpt = "",
  onExcerptChange,
  slug = "",
  onSlugChange,
  showExcerpt = true,
  showSlug = true,
  showFormat = false,
  format = "prose",
  onFormatChange,
  triggerLabel = "Settings",
}: EditorSettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 rounded-md px-2.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Settings2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{triggerLabel}</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-y-auto border-l border-border bg-background p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-6 py-5 text-left">
          <SheetTitle className="text-base font-semibold">
            Post settings
          </SheetTitle>
          <SheetDescription className="text-xs">
            Cover, tags, and publishing metadata.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 px-6 py-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Cover image
              </Label>
              {coverImage && onClearCover && (
                <button
                  type="button"
                  onClick={onClearCover}
                  className="inline-flex items-center gap-1 text-[11px] text-destructive hover:underline"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              )}
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border bg-background py-8 text-center transition-colors hover:border-foreground/40">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={onCoverFileChange}
                className="hidden"
              />
              {isUploadingCover ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="max-h-40 w-full object-cover"
                />
              ) : (
                <>
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Upload cover (JPEG, PNG, WebP, GIF · 5 MB)
                  </span>
                </>
              )}
            </label>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="editor-tags"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Tags
            </Label>
            <Input
              id="editor-tags"
              value={tags}
              onChange={(e) => onTagsChange(e.target.value)}
              placeholder="Comma-separated tags"
              className="h-9 rounded-md text-sm"
            />
          </div>

          {showExcerpt && onExcerptChange && (
            <div className="space-y-2">
              <Label
                htmlFor="editor-excerpt"
                className="text-xs uppercase tracking-wider text-muted-foreground"
              >
                Excerpt
              </Label>
              <Textarea
                id="editor-excerpt"
                value={excerpt}
                onChange={(e) => onExcerptChange(e.target.value)}
                rows={3}
                placeholder="Short teaser for cards and previews"
                className="resize-none text-sm"
              />
            </div>
          )}

          {showSlug && onSlugChange && (
            <div className="space-y-2">
              <Label
                htmlFor="editor-slug"
                className="text-xs uppercase tracking-wider text-muted-foreground"
              >
                Slug
              </Label>
              <Input
                id="editor-slug"
                value={slug}
                onChange={(e) => onSlugChange(e.target.value)}
                placeholder="url-slug"
                className="h-9 rounded-md font-mono text-sm"
              />
            </div>
          )}

          {showFormat && onFormatChange && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Format
              </Label>
              <Select
                value={format}
                onValueChange={(v) => onFormatChange(v as PostFormatOption)}
              >
                <SelectTrigger className="h-9 rounded-md text-sm">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prose">Prose</SelectItem>
                  <SelectItem value="poetry">Poetry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
