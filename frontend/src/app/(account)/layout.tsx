import { SiteChrome } from "@/components/layout/SiteChrome";
import { fontMono } from "@/lib/fonts";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={fontMono.variable}>
      <SiteChrome>{children}</SiteChrome>
    </div>
  );
}
