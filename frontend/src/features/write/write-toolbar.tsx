"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  Save,
  Send,
  ArrowLeft,
  Loader2,
  Check,
  Settings2,
  LetterText,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ICON_CLASS, NAV_STROKE } from "@/components/layout/nav-metrics";
import { WriteMetaFields, type WriteMetaFieldsProps } from "./write-meta-fields";
import {
  WRITE_CHROME_INSET_CLASS,
  WRITE_TOOLBAR_TOP_CLASS,
} from "./layout-classes";
import type { PublicationRole } from "@/types/database";

type Props = {
  editId: string | null | undefined;
  isAutoSaving: boolean;
  lastSaved: Date | null;
  settingsOpen: boolean;
  onSettingsOpenChange: (open: boolean) => void;
  metaProps: Omit<WriteMetaFieldsProps, "idPrefix" | "expandMoreInitially">;
  expandMoreInitially: boolean;
  status: string;
  isLoading: boolean;
  onSaveDraftClick: () => void;
  onPublishClick: () => void;
  onSubmitForReviewClick?: () => void;
  publicationName?: string | null;
  publicationSlug?: string | null;
  memberRole?: PublicationRole | null;
};

export function WriteToolbar({
  editId,
  isAutoSaving,
  lastSaved,
  settingsOpen,
  onSettingsOpenChange,
  metaProps,
  expandMoreInitially,
  status,
  isLoading,
  onSaveDraftClick,
  onPublishClick,
  onSubmitForReviewClick,
  publicationName,
  publicationSlug,
  memberRole,
}: Props) {
  const isPublicationPost = Boolean(publicationName || publicationSlug);
  const canDirectPublish = !isPublicationPost || memberRole === "editor";
  const backHref = publicationSlug ? `/${publicationSlug}` : "/dashboard";
  const backLabel = publicationSlug
    ? `Back to ${publicationName || "publication"}`
    : "Back to dashboard";

  const statusHeading = editId
    ? status === "published"
      ? "Editing Live Post"
      : status === "in_review"
        ? "In Editor Review"
        : "Editing Draft"
    : isPublicationPost
      ? `New ${publicationName || "CSI"} Draft`
      : "New Draft";

  const statusSubheading =
    status === "published"
      ? "Autosave keeps your changes on the live post"
      : status === "in_review"
        ? "Submitted to CSI editors for review"
        : "Autosaves when you pause typing";

  return (
    <div
      className={cn(
        WRITE_TOOLBAR_TOP_CLASS,
        "fixed inset-x-0 z-40 border-b border-border/25 bg-background/88 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/72",
      )}
    >
      <div
        className={cn(
          WRITE_CHROME_INSET_CLASS,
          "flex h-11 w-full items-center justify-between gap-3",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            asChild
          >
            <Link href={backHref} aria-label={backLabel}>
              <ArrowLeft
                className={NAV_ICON_CLASS}
                strokeWidth={NAV_STROKE}
              />
            </Link>
          </Button>

          {isPublicationPost && (
            <Badge
              variant="secondary"
              className="shrink-0 rounded-full px-2.5 py-0.5 font-sans text-[11px] font-semibold"
            >
              {publicationName || "CSI Tech Blog"}
            </Badge>
          )}

          <div className="hidden min-w-0 flex-col leading-tight sm:flex">
            <p className="truncate font-sans text-sm font-semibold tracking-tight text-foreground">
              {statusHeading}
            </p>
            <p className="truncate font-sans text-[11px] text-muted-foreground/70">
              {statusSubheading}
            </p>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {isAutoSaving ? (
            <div className="flex items-center gap-1.5 rounded-full bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </div>
          ) : lastSaved ? (
            <div className="flex items-center gap-1.5 rounded-full bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
              <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span className="tabular-nums">
                Saved{" "}
                {lastSaved.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground/80">
              {status === "in_review" ? (
                <Clock className="h-3 w-3 text-amber-500" />
              ) : (
                <LetterText className="h-3 w-3 opacity-50" />
              )}
              <span>
                {status === "published"
                  ? "Live"
                  : status === "in_review"
                    ? "In Review"
                    : "Draft"}
              </span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="md:hidden">
            <ThemeToggle />
          </div>

          <Sheet open={settingsOpen} onOpenChange={onSettingsOpenChange}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex h-9 items-center gap-1.5 rounded-full px-2.5 font-sans text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground lg:hidden"
              >
                <Settings2
                  className={NAV_ICON_CLASS}
                  strokeWidth={NAV_STROKE}
                />
                <span>Details</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-full flex-col overflow-y-auto rounded-l-3xl border-l border-border/50 bg-background p-0 sm:max-w-md"
            >
              <SheetHeader className="border-b border-border/40 px-6 py-5">
                <SheetTitle className="font-sans text-base font-semibold">
                  Post Settings
                </SheetTitle>
                <SheetDescription className="font-sans text-xs text-muted-foreground/70">
                  Cover, slug, tags. Use &ldquo;More options&rdquo; for excerpt.
                </SheetDescription>
              </SheetHeader>
              <div className="scrollbar-meta flex-1 overflow-y-auto px-6 py-6 pr-5">
                <WriteMetaFields
                  {...metaProps}
                  idPrefix="sheet"
                  expandMoreInitially={expandMoreInitially}
                />
              </div>
            </SheetContent>
          </Sheet>

          {status !== "published" ? (
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-full border-border/80 px-3 font-sans text-sm sm:px-4"
                disabled={isLoading}
                onClick={onSaveDraftClick}
                aria-label="Save draft"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 shrink-0" strokeWidth={NAV_STROKE} />
                )}
                <span className="hidden sm:inline">Save draft</span>
                <span className="sm:hidden">Save</span>
              </Button>

              {isPublicationPost && !canDirectPublish ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-9 gap-2 rounded-full px-4 font-sans text-sm shadow-sm"
                  disabled={isLoading}
                  onClick={onSubmitForReviewClick}
                  aria-label="Submit post for editor review"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <Send
                      className="h-4 w-4 shrink-0"
                      strokeWidth={NAV_STROKE}
                    />
                  )}
                  <span className="hidden sm:inline">
                    {status === "in_review"
                      ? "Update submission"
                      : "Submit for review"}
                  </span>
                  <span className="sm:hidden">Submit</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="h-9 gap-2 rounded-full px-4 font-sans text-sm shadow-sm"
                  disabled={isLoading}
                  onClick={onPublishClick}
                  aria-label={editId ? "Publish changes" : "Publish post"}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <Send
                      className="h-4 w-4 shrink-0"
                      strokeWidth={NAV_STROKE}
                    />
                  )}
                  <span>Publish</span>
                </Button>
              )}
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              className="h-9 gap-2 rounded-full px-4 font-sans text-sm shadow-sm"
              disabled={isLoading}
              onClick={onPublishClick}
              aria-label="Update published post"
            >
              {isLoading && (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              )}
              <Send className="h-4 w-4 shrink-0" strokeWidth={NAV_STROKE} />
              <span className="hidden sm:inline">Update</span>
              <span className="sm:hidden">Save</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
