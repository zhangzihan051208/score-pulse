import type { Metadata } from "next";
import { GuidePage } from "@/components/guide-page";

export const metadata: Metadata = { title: "Guide" };

export default function Guide() {
  return <GuidePage />;
}
