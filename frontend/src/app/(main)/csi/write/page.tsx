import { redirect } from "next/navigation";

export default async function CsiWriteRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; id?: string }>;
}) {
  const params = await searchParams;
  const targetId = params.id || params.edit;
  redirect(
    targetId
      ? `/tech-weekly/write?id=${encodeURIComponent(targetId)}`
      : "/tech-weekly/write"
  );
}
