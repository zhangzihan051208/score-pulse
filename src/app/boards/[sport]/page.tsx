import { notFound } from "next/navigation";
import { BoardPage } from "@/components/board-page";
import { SPORTS, type Sport } from "@/lib/types";

export const revalidate = 30;

export function generateStaticParams() {
  return SPORTS.map((sport) => ({ sport }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;
  return { title: sport.toUpperCase() };
}

export default async function SportBoard({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;
  if (!SPORTS.includes(sport as Sport)) notFound();
  return <BoardPage sport={sport as Sport} />;
}
