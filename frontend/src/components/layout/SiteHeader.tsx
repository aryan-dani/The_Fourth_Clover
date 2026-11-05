import { SiteHeaderClient } from "@/components/layout/header/SiteHeaderClient";

/**
 * Static guest chrome. Signed-in state is filled in on the client so public
 * pages do not call cookies() or Supabase Auth during the server render.
 */
export function SiteHeader() {
  return <SiteHeaderClient />;
}
