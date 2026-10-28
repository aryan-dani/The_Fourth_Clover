import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteMotion } from "@/components/layout/SiteMotion";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--fg)]">
      <SiteMotion>
        <SiteHeader />
        <main
          id="main"
          className="flex-1 pt-24 md:pt-28"
        >
          <div id="content">{children}</div>
        </main>
        <SiteFooter />
      </SiteMotion>
    </div>
  );
}
