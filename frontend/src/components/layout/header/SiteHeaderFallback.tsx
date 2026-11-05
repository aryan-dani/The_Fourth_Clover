import { SiteHeaderClient } from "@/components/layout/header/SiteHeaderClient";

/** Guest chrome. Auth state is resolved on the client. */
export function SiteHeaderFallback() {
  return <SiteHeaderClient />;
}
