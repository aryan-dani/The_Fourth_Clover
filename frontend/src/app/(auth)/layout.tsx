import { fontScript } from "@/lib/fonts";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={fontScript.variable}>{children}</div>;
}
