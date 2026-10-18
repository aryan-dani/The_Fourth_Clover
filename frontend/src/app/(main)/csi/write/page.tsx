import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getPublicationBySlug,
  getUserPublicationRole,
} from "@/features/data/server-queries";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WriteClient } from "@/app/(account)/write/write-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Write for CSI | The Fourth Clover",
  description: "Draft and submit a technical article for the CSI MIT-WPU Tech Blog.",
  robots: { index: false, follow: false },
};

export default async function CsiWritePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const [publication, roleInfo] = await Promise.all([
    getPublicationBySlug("csi"),
    getUserPublicationRole("csi", user.id),
  ]);

  if (!publication || !roleInfo.role) {
    return (
      <PageShell className="py-12">
        <div className="container mx-auto max-w-xl px-4">
          <Card className="glass-card border-border/60">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-500">
                <ShieldAlert className="h-6 w-6" aria-hidden />
              </div>
              <h1 className="font-display mb-2 text-2xl font-bold tracking-tight">
                CSI Membership Required
              </h1>
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                Only verified CSI MIT-WPU technical writers and editors can draft or submit articles for the CSI Tech Blog. You can still write personal posts on the main platform or contact a CSI Technical Lead to be added as a member.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button asChild variant="outline" className="gap-2 rounded-full">
                  <Link href="/csi">
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Back to CSI Tech Blog
                  </Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href="/write">Write Personal Story</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  return (
    <WriteClient
      publicationId={publication.id}
      publicationSlug={publication.slug}
      publicationName={publication.name}
      memberRole={roleInfo.role}
    />
  );
}
