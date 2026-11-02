import { PausedSection } from "@/components/paused-section";
import { VipPageInner } from "@/components/vip-page-inner";
import { VIP_BILLING_ENABLED } from "@/lib/vip";

export default function VipPage() {
  if (!VIP_BILLING_ENABLED) return <PausedSection />;
  return <VipPageInner />;
}
