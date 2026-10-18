import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HomeHeroClient } from "@/components/home/HomeHeroClient";
import { fetchFeaturedTechWeeklyPost } from "@/features/data/tech-weekly-actions";

export default async function HomePage() {
  const featuredPick = await fetchFeaturedTechWeeklyPost();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <HomeHeroClient featuredPick={featuredPick} />
      </main>
      <Footer />
    </div>
  );
}
