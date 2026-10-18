import { TeamSchedulePageInner } from "@/components/team-schedule-page";

export default async function TeamSchedulePage({
  params,
}: {
  params: Promise<{ partition: string }>;
}) {
  const { partition } = await params;
  return <TeamSchedulePageInner path={partition} />;
}
