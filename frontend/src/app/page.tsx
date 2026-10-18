import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HomeHeroClient } from "@/components/home/HomeHeroClient";
import { fetchFeaturedTechWeeklyPost } from "@/features/data/tech-weekly-actions";

export default async function HomePage() {
  const featuredPick = await fetchFeaturedTechWeeklyPost();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.14),transparent_68%)]"
      />

      <Header />

      <main className="relative flex flex-1 flex-col items-center justify-center">
        <HomeHeroClient featuredPick={featuredPick} />
      </main>

      <Footer />
    </div>
  );
}
