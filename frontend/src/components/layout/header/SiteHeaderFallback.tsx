import { SiteHeaderClient } from "@/components/layout/header/SiteHeaderClient";
import { getCapabilities } from "@/lib/roles";

/** Static guest chrome while signed-in profile resolves. */
export function SiteHeaderFallback() {
  return (
    <SiteHeaderClient
      signedIn={false}
      profile={null}
      capabilities={getCapabilities(null)}
    />
  );
}
