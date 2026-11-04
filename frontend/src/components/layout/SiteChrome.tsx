import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteHeaderFallback } from "@/components/layout/header/SiteHeaderFallback";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  PageTransition,
  SiteMotion,
} from "@/components/layout/SiteMotion";
import { SmoothScrollProvider } from "@/components/motion/SmoothScroll";
import { fontScript } from "@/lib/fonts";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${fontScript.variable} flex min-h-screen flex-col bg-[var(--bg)] text-[var(--fg)]`}
    >
      <SmoothScrollProvider>
        <SiteMotion>
          <Suspense fallback={<SiteHeaderFallback />}>
            <SiteHeader />
          </Suspense>
          <main id="main" className="flex-1 pt-24 md:pt-28">
            <PageTransition>
              <div id="content">{children}</div>
            </PageTransition>
            <SiteFooter />
          </main>
        </SiteMotion>
      </SmoothScrollProvider>
    </div>
  );
}
