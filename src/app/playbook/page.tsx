import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "立项手册",
};

const sections = [
  {
    title: "1. 先把产品钉死",
    body: [
      "赛评台不是比分直播，也不是球员百科。核心动作只有两步：对「某场赛事里的某名选手」打分，以及围绕这场表现写评论。",
      "立项时先写清三句话：给谁用（球迷、战术爱好者、媒体编辑）、在什么时刻用（赛中 / 赛后 30 分钟）、怎样算一条好内容（具体回合，而不是胜负喊麦）。",
      "第一版只做 1–2 个运动项目。项目一多，评分维度、数据字段和审核口径都会分叉。",
    ],
  },
  {
    title: "2. 评分规则要提前写进产品",
    body: [
      "维度：建议固定为技术、战术、体能、心态、整体。不同运动可以改提示文案，不要一上来每人一套量表。",
      "尺度：0–10，0.5 步进。需要说明 6 分是合格、8 分是明显高光、9 分以上要写理由。",
      "对象：评的是「本场表现」，不是生涯名气。未上场可以打预期分，赛后允许覆盖一次。",
      "聚合：展示社区均分、打分人数、你的分与均分差。后续再加去掉极端分、时间衰减、专家权重。",
    ],
  },
  {
    title: "3. 内容与数据准备",
    body: [
      "赛程：赛事名称、时间、场馆、状态（未开赛 / 进行中 / 已结束）。",
      "名单：选手姓名、队伍/协会、本场位置或签位、可公开的官方技术统计。",
      "表现卡：一句话高光 + 3–6 个关键数据。没有官方源时，先人工录入演示场次。",
      "数据源选项：联赛官方 API、 Sportradar / Opta 一类供应商、媒体合作、编辑后台手录。第一版用编辑后台就够。",
      "版权：队徽、肖像、完整转播画面不能随便用。演示阶段用渐变、姓名和公开赛果，上线前找法务过素材。",
    ],
  },
  {
    title: "4. 社区与合规",
    body: [
      "用户协议和社区规范：禁止人身攻击、造谣、赌博串通、未授权直播链接。",
      "审核：先做关键词+举报，再加人审。评分本身也要防刷分（同设备、同 IP、异常全 10 或全 0）。",
      "未成年人：青少年选手的评论区要更严，必要时只开评分、关闭自由评论。",
      "隐私：昵称即可起步。真要做账号，准备手机号/邮箱登录、注销、数据导出。",
    ],
  },
  {
    title: "5. 怎么分步做",
    body: [
      "切片一（本仓库）：赛程 → 选手表现卡 → 五维打分 → 评论 → 社区动态。验证「人们愿不愿意按表现而不是胜负说话」。",
      "切片二：账号、每人每场限评一次可改、关注的球队/选手、推送赛后提醒。",
      "切片三：编辑后台录入赛程、官方数据对接、热门评论、专家账号。",
      "切片四：App（可继续用这套 Web 做套壳）、直播间同步、积分与等级。不要第一天就做直播和电商。",
    ],
  },
  {
    title: "6. 团队和工具准备",
    body: [
      "角色：产品（规则和审核口径）、运营/编辑（赛程和表现卡）、设计（赛中 30 秒能完成打分）、工程（Web 先于原生 App）、法务（素材与社区）。",
      "技术：Next.js 做 Web；数据先 JSON/本地存储，再 Postgres；对象存储放头像；队列做通知。原生 App 等核心环跑通再上。",
      "验证：找 20 个球迷看一场球，看他们能不能在 1 分钟内打完分、评论是不是具体。如果全在刷「神」或「垃圾」，是规则没写清。",
    ],
  },
];

export default function PlaybookPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="space-y-3">
        <p className="text-sm text-primary">给负责人的开工清单</p>
        <h1 className="text-3xl font-semibold">做体育评分社区，要准备什么</h1>
        <p className="leading-7 text-muted-foreground">
          你要的不是一个「体育 App 框架」，而是一条能打分、能评论、能看见社区风向的闭环。下面按立项顺序写。仓库里的页面已经把闭环做出来了，手册对应的是上线前还要补的东西。
        </p>
        <Button render={<Link href="/" />}>去评一场球</Button>
      </div>

      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 leading-7 text-sm">
            {section.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle>这个演示已经具备</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-7">
          <p>5 场跨项目赛事、选手表现卡、五维滑杆、评论、社区动态、本机昵称。</p>
          <p>刻意没做：登录、数据库、支付、推送、直播。那些是切片二以后的事。</p>
          <p>
            本地运行：<code className="rounded bg-muted px-1">npm install</code>{" "}
            后{" "}
            <code className="rounded bg-muted px-1">
              npm run dev -- --port 43147
            </code>
            。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
