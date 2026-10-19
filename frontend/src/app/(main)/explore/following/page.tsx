import { redirect } from "next/navigation";

/** /explore/following permanently redirects to /following (see next.config.js). */
export default function ExploreFollowingPage() {
  redirect("/following");
}
