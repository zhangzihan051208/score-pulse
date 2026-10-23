import { ZoneDetailPageInner } from "@/components/zone-detail-page";

export default async function ZonePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ZoneDetailPageInner slug={slug} />;
}
