"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertCircle } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { PostFormValues } from "@/features/write/write-meta-fields";

type Props = {
  form: UseFormReturn<PostFormValues>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  submissionMessage: string;
  wordCount: number;
  readTime: number;
  scheduled_at: string | null | undefined;
};

export function WriteEditorForm({
  form,
  onSubmit,
  submissionMessage,
  wordCount,
  readTime,
  scheduled_at,
}: Props) {
  return (
    <>
      {submissionMessage && (
        <div className="w-full max-w-[65ch] pb-4">
          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submissionMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="w-full max-w-[65ch] pb-28 lg:pb-32"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Title"
                  {...field}
                  className="font-display h-auto border-0 bg-transparent p-0 text-3xl font-semibold tracking-tight text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-0 sm:text-4xl md:text-[2.65rem]"
                  maxLength={100}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-6">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Start writing. Markdown and plain text both work."
                    {...field}
                    className="min-h-[58vh] resize-none overflow-y-auto border-0 bg-transparent px-0 py-0 font-serif text-base leading-[1.82] text-foreground/90 shadow-none ring-0 placeholder:text-muted-foreground/30 focus-visible:ring-0 sm:min-h-[62vh] sm:text-[17px] sm:leading-[1.88]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 font-sans text-[11px] tabular-nums tracking-wide text-muted-foreground/50">
            <span>{wordCount} words</span>
            <span className="h-2.5 w-px bg-border/25" aria-hidden />
            <span>{readTime} min read</span>
          </div>
          {scheduled_at && (
            <div className="flex items-center gap-1.5 text-[11px] text-primary">
              <Clock className="h-3 w-3 shrink-0 opacity-80" />
              <span className="font-sans text-muted-foreground">
                Scheduled{" "}
                <span className="text-primary">
                  {new Date(scheduled_at).toLocaleString()}
                </span>
              </span>
            </div>
          )}
        </div>
      </form>
    </>
  );
}
