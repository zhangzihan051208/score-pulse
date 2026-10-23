import { ZoneItemPageInner } from "@/components/zone-item-page";

export default async function ZoneItemPage({
  params,
}: {
  params: Promise<{ slug: string; itemId: string }>;
}) {
  const { slug, itemId } = await params;
  return <ZoneItemPageInner slug={slug} itemId={itemId} />;
}
