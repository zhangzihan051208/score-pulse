import { ZoneManagePageInner } from "@/components/zone-manage-page";

export default async function ZoneManagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ZoneManagePageInner slug={slug} />;
}
