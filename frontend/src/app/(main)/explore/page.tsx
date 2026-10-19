import { redirect } from "next/navigation";

/** /explore permanently redirects to /journal (see next.config.js). */
export default function ExplorePage() {
  redirect("/journal");
}
