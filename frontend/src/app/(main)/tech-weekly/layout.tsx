import { fontMono } from "@/lib/fonts";

/** JetBrains Mono only where Tech Weekly renders code and mono chrome. */
export default function TechWeeklyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={fontMono.variable}>{children}</div>;
}
