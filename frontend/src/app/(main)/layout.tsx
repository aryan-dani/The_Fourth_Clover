import { SiteChrome } from "@/components/layout/SiteChrome";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteChrome>{children}</SiteChrome>;
}
