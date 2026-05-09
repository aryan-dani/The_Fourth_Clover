import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20 pb-8">{children}</main>
      <Footer />
    </div>
  );
}
