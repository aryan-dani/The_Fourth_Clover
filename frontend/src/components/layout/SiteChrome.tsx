import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      {/* Top dock clearance + mobile bottom dock clearance */}
      <main className="flex-1 pt-[4.75rem] pb-24 md:pb-0 sm:pt-[5.25rem]">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
