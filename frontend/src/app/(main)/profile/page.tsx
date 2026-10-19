import { redirect } from "next/navigation";

/** Profile editing lives at /settings; next.config also redirects /profile → /settings. */
export default function ProfilePage() {
  redirect("/settings");
}
