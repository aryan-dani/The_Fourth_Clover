"use client";

import { useState, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import type * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  ImageIcon,
  Loader2,
  X,
  Calendar,
  Tag,
  FileText,
  Link2,
  ChevronDown,
} from "lucide-react";
import { postSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";

export type PostFormValues = z.infer<typeof postSchema>;

const META_CONTROL =
  "rounded-lg border-border/70 bg-background shadow-sm transition-colors focus-visible:border-primary/45";

export type WriteMetaFieldsProps = {
  form: UseFormReturn<PostFormValues>;
  tagInput: string;
  setTagInput: (v: string) => void;
  tags: string[];
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  handleImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  idPrefix: string;
  /** Open “More options” when editing a post that already uses these fields */
  expandMoreInitially?: boolean;
};

export function WriteMetaFields({
  form,
  tagInput,
  setTagInput,
  tags,
  addTag,
  removeTag,
  handleImageFileChange,
  isUploading,
  idPrefix,
  expandMoreInitially,
}: WriteMetaFieldsProps) {
  const coverId = `cover-upload-${idPrefix}`;
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (expandMoreInitially) setMoreOpen(true);
  }, [expandMoreInitially]);

  return (
    <div className="space-y-5 font-sans text-[13px] leading-snug antialiased">
      <FormField
        control={form.control}
        name="cover_image"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="inline-flex items-center gap-2 text-xs font-medium leading-none text-foreground/90">
              <ImageIcon className="h-3.5 w-3.5 shrink-0 translate-y-px text-muted-foreground" />
              Cover image
            </FormLabel>
            {field.value ? (
              <div className="relative overflow-hidden rounded-xl border border-border/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={field.value}
                  alt="Cover"
                  className="h-24 w-full object-cover sm:h-28"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => form.setValue("cover_image", "")}
                  className="absolute right-2 top-2 rounded-lg text-xs"
                >
                  <X className="mr-1 h-3 w-3" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex min-h-[104px] flex-col items-center justify-center rounded-xl border border-dashed border-border/55 bg-muted/[0.11] px-4 py-5 text-center transition-colors hover:border-primary/35 hover:bg-muted/20">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                  id={coverId}
                />
                <label htmlFor={coverId} className="block cursor-pointer">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-xs">Uploading…</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                      <ImageIcon className="h-5 w-5 text-muted-foreground/55" />
                      <span className="text-xs font-medium text-foreground/80">
                        Add image
                      </span>
                      <span className="text-[11px] text-muted-foreground/65">
                        PNG or JPG
                      </span>
                    </div>
                  )}
                </label>
              </div>
            )}
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="slug"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="inline-flex items-center gap-2 text-xs font-medium leading-none text-foreground/90">
              <Link2 className="h-3.5 w-3.5 shrink-0 translate-y-px text-muted-foreground" />
              URL slug
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="your-post-slug"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                className={cn(
                  META_CONTROL,
                  "write-slug-input h-9 text-xs leading-normal text-foreground",
                )}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <Label className="inline-flex items-center gap-2 text-xs font-medium leading-none text-foreground/90">
          <Tag className="h-3.5 w-3.5 shrink-0 translate-y-px text-muted-foreground" />
          Tags
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="Type and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(tagInput);
                setTagInput("");
              }
            }}
            className={cn(META_CONTROL, "h-9 min-w-0 flex-1 text-sm")}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-9 shrink-0 rounded-lg font-sans text-xs font-medium",
              tagInput
                ? "border-primary/35 text-foreground hover:bg-primary/10"
                : "border-border/60 text-muted-foreground",
            )}
            onClick={() => {
              addTag(tagInput);
              setTagInput("");
            }}
            disabled={!tagInput}
          >
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {tags.map((tag: string) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer gap-1 rounded-md py-0.5 pl-2 pr-1 font-sans text-xs font-normal hover:bg-destructive/15"
                onClick={() => removeTag(tag)}
              >
                {tag}
                <X className="h-3 w-3 opacity-70" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/25 px-3 py-2.5 text-left transition-colors hover:bg-muted/35"
          >
            <span className="text-xs font-medium text-foreground/90">
              More options
              <span className="ml-1.5 font-normal text-muted-foreground/70">
                — schedule, excerpt
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                moreOpen && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 overflow-hidden pt-1">
          <FormField
            control={form.control}
            name="scheduled_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="inline-flex items-center gap-2 text-xs font-medium leading-none text-foreground/90">
                  <Calendar className="h-3.5 w-3.5 shrink-0 translate-y-px text-muted-foreground" />
                  Schedule
                </FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      type="datetime-local"
                      value={
                        field.value
                          ? new Date(field.value).toISOString().slice(0, 16)
                          : ""
                      }
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => {
                        field.onChange(
                          e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null,
                        );
                      }}
                      className={cn(META_CONTROL, "h-9 min-w-0 flex-1 text-sm")}
                    />
                    {field.value && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-lg"
                        onClick={() => field.onChange(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="excerpt"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="inline-flex items-center gap-2 text-xs font-medium leading-none text-foreground/90">
                  <FileText className="h-3.5 w-3.5 shrink-0 translate-y-px text-muted-foreground" />
                  Excerpt
                  <span className="font-normal text-muted-foreground/60">
                    · optional
                  </span>
                </FormLabel>
                <FormControl>
                  <div
                    className={cn(
                      META_CONTROL,
                      "overflow-hidden focus-within:border-primary/45 focus-within:ring-2 focus-within:ring-ring/30 focus-within:ring-offset-2 focus-within:ring-offset-background",
                    )}
                  >
                    <Textarea
                      placeholder="Listings & previews…"
                      {...field}
                      rows={3}
                      maxLength={300}
                      className="min-h-[80px] resize-none border-0 bg-transparent !resize-none px-3 py-2 font-sans text-sm leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </FormControl>
                <div className="text-right font-sans text-[11px] tabular-nums text-muted-foreground/55">
                  {(field.value || "").length}/300
                </div>
              </FormItem>
            )}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
