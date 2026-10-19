import { SiteChrome } from "@/components/layout/SiteChrome";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteChrome>{children}</SiteChrome>;
}
