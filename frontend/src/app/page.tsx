import { SiteChrome } from "@/components/layout/SiteChrome";
import { HomePageClient } from "@/components/home/HomePageClient";
import { fetchHomeData } from "@/features/data/home-queries";

export const revalidate = 15;

export default async function HomePage() {
  const data = await fetchHomeData();

  return (
    <SiteChrome>
      <HomePageClient data={data} />
    </SiteChrome>
  );
}
