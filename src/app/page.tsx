import Link from "next/link";
import { ArrowRight, ClipboardList, MessageSquareText, Scale } from "lucide-react";
import { HomeEvents } from "@/components/home-events";
import { Button } from "@/components/ui/button";
import { events } from "@/lib/data";

export default function HomePage() {
  const liveCount = events.filter((e) => e.status === "live").length;

  return (
    <div>
      <section className="bg-[#0d1f18] text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
          <div className="space-y-5">
            <p className="text-sm tracking-wide text-amber-300">
              {liveCount} 场比赛正在接受社区评分
            </p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-5xl">
              别只刷比分。
              <br />
              给这场表现打个分。
            </h1>
            <p className="max-w-xl text-base leading-7 text-white/75 sm:text-lg">
              赛评台是体育社区的第一刀：选一场赛事，对选手的技术、战术、体能、心态和整体打分，再用具体回合写下评论。胜负是结果，表现是可以讨论的。
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-amber-400 text-[#0d1f18] hover:bg-amber-300"
                render={<Link href="/playbook" />}
              >
                先看要准备什么
                <ArrowRight />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
                render={<Link href="/feed" />}
              >
                看社区动态
              </Button>
            </div>
          </div>
          <ul className="grid gap-3 self-center">
            {[
              {
                icon: Scale,
                title: "五维评分",
                body: "技术 / 战术 / 体能 / 心态 / 整体，避免一条「10 分」糊过去。",
              },
              {
                icon: MessageSquareText,
                title: "围绕表现写评",
                body: "评论要求写具体回合，不鼓励只喊赢了或黑谁。",
              },
              {
                icon: ClipboardList,
                title: "立项就能用的清单",
                body: "产品规则、数据、合规、运营和技术分期都写在手册里。",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <item.icon className="mb-2 size-5 text-amber-300" />
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-white/70">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div>
          <h2 className="text-2xl font-semibold">今日可评赛事</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            数据是演示用的。你的评分和评论写在浏览器本地，用来走通产品流程。
          </p>
        </div>
        <HomeEvents />
      </div>
    </div>
  );
}
