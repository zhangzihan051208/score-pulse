import type {
  Athlete,
  DimensionId,
  MatchEvent,
  SeedComment,
  Sport,
} from "./types";

export const DIMENSIONS: {
  id: DimensionId;
  label: string;
  hint: string;
}[] = [
  { id: "technique", label: "技术", hint: "动作质量、完成度、失误控制" },
  { id: "tactics", label: "战术", hint: "阅读比赛、节奏与临场调整" },
  { id: "fitness", label: "体能", hint: "强度、移动、后程是否掉速" },
  { id: "mentality", label: "心态", hint: "关键分、抗压、专注度" },
  { id: "overall", label: "整体", hint: "这场表现给你的综合印象" },
];

export const SPORT_LABEL: Record<Sport, string> = {
  badminton: "羽毛球",
  basketball: "篮球",
  football: "足球",
  "table-tennis": "乒乓球",
  athletics: "田径",
};

export const STATUS_LABEL: Record<MatchEvent["status"], string> = {
  live: "进行中",
  upcoming: "未开赛",
  ended: "已结束",
};

export const athletes: Record<string, Athlete> = {
  "shi-yuqi": {
    id: "shi-yuqi",
    name: "石宇奇",
    shortName: "石",
    country: "中国",
    team: "中国男队",
  },
  "kodai-naraoka": {
    id: "kodai-naraoka",
    name: "奈良冈功大",
    shortName: "奈",
    country: "日本",
    team: "日本男队",
  },
  "li-shifeng": {
    id: "li-shifeng",
    name: "李诗沣",
    shortName: "沣",
    country: "中国",
    team: "中国男队",
  },
  "yi-jianlian": {
    id: "yi-jianlian",
    name: "易建联",
    shortName: "联",
    country: "中国",
    team: "广东",
  },
  "guo-ailun": {
    id: "guo-ailun",
    name: "郭艾伦",
    shortName: "郭",
    country: "中国",
    team: "辽宁",
  },
  "zhao-rui": {
    id: "zhao-rui",
    name: "赵睿",
    shortName: "睿",
    country: "中国",
    team: "广东",
  },
  "wu-lei": {
    id: "wu-lei",
    name: "武磊",
    shortName: "磊",
    country: "中国",
    team: "上海海港",
  },
  "fellaini": {
    id: "fellaini",
    name: "费莱尼",
    shortName: "费",
    country: "比利时",
    team: "山东泰山",
  },
  "oscar": {
    id: "oscar",
    name: "奥斯卡",
    shortName: "奥",
    country: "巴西",
    team: "上海海港",
  },
  "sun-yingsha": {
    id: "sun-yingsha",
    name: "孙颖莎",
    shortName: "莎",
    country: "中国",
    team: "中国女队",
  },
  "chen-meng": {
    id: "chen-meng",
    name: "陈梦",
    shortName: "梦",
    country: "中国",
    team: "中国女队",
  },
  "su-bingtian": {
    id: "su-bingtian",
    name: "苏炳添",
    shortName: "添",
    country: "中国",
    team: "中国田径队",
  },
  "xie-zhenye": {
    id: "xie-zhenye",
    name: "谢震业",
    shortName: "业",
    country: "中国",
    team: "中国田径队",
  },
};

export const events: MatchEvent[] = [
  {
    id: "thomas-sf",
    slug: "thomas-cup-sf",
    title: "汤姆斯杯半决赛",
    subtitle: "中国 vs 日本 · 男单第一单打",
    sport: "badminton",
    venue: "成都高新体育中心",
    startAt: "2026-05-16T11:30:00+08:00",
    status: "live",
    cover: "from-emerald-800 via-teal-700 to-lime-600",
    summary:
      "第一单打进入决胜局。社区正在给开场抢攻、网前质量和关键分处理打分，不只看比分。",
    performances: [
      {
        athleteId: "shi-yuqi",
        role: "男单第一单打",
        seed: 1,
        result: "决胜局进行中",
        highlight: "开局连拿 4 分，后场突击落点更尖，但第三局体能曲线开始掉。",
        stats: [
          { label: "局分", value: "21-18 / 16-21 / 11-9" },
          { label: "主动得分", value: "28" },
          { label: "非受迫失误", value: "14" },
        ],
        communityAvg: {
          technique: 8.4,
          tactics: 8.1,
          fitness: 7.2,
          mentality: 8.6,
          overall: 8.2,
        },
        ratingCount: 1284,
      },
      {
        athleteId: "kodai-naraoka",
        role: "男单第一单打",
        seed: 5,
        result: "决胜局进行中",
        highlight: "第二局改打多拍消耗，防守到位率高，但进攻终结偏软。",
        stats: [
          { label: "局分", value: "18-21 / 21-16 / 9-11" },
          { label: "多拍回合", value: "19" },
          { label: "网前得分", value: "11" },
        ],
        communityAvg: {
          technique: 7.9,
          tactics: 8.3,
          fitness: 8.5,
          mentality: 7.8,
          overall: 8.0,
        },
        ratingCount: 902,
      },
      {
        athleteId: "li-shifeng",
        role: "男单第二单打 · 待上场",
        seed: 4,
        highlight: "热身区已就位。社区可先根据近期状态打「预期分」，赛后可改。",
        stats: [
          { label: "近 5 场胜率", value: "4-1" },
          { label: "状态标签", value: "进攻型" },
        ],
        communityAvg: {
          technique: 8.0,
          tactics: 7.4,
          fitness: 8.1,
          mentality: 7.5,
          overall: 7.7,
        },
        ratingCount: 211,
      },
    ],
  },
  {
    id: "cba-south",
    slug: "cba-guangdong-liaoning",
    title: "CBA 常规赛",
    subtitle: "广东 108-104 辽宁",
    sport: "basketball",
    venue: "东莞篮球中心",
    startAt: "2026-03-22T19:35:00+08:00",
    status: "ended",
    cover: "from-orange-800 via-red-700 to-amber-500",
    summary:
      "末节被追到 2 分。内线护筐、外线决策和关键罚球是社区争议最大的三个点。",
    performances: [
      {
        athleteId: "yi-jianlian",
        role: "中锋",
        result: "21 分 13 板 4 帽",
        highlight: "护筐仍在线，但转换进攻回防两次失位，社区对体能意见分裂。",
        stats: [
          { label: "投篮", value: "8/15" },
          { label: "篮板", value: "13" },
          { label: "正负值", value: "+9" },
        ],
        communityAvg: {
          technique: 8.1,
          tactics: 7.6,
          fitness: 6.9,
          mentality: 8.4,
          overall: 7.8,
        },
        ratingCount: 3560,
      },
      {
        athleteId: "guo-ailun",
        role: "后卫",
        result: "18 分 7 助 5 失误",
        highlight: "前三节组织清楚，末节连续攻坚被包夹，选择引发讨论。",
        stats: [
          { label: "助攻", value: "7" },
          { label: "失误", value: "5" },
          { label: "三分", value: "2/8" },
        ],
        communityAvg: {
          technique: 7.4,
          tactics: 6.8,
          fitness: 7.7,
          mentality: 7.1,
          overall: 7.0,
        },
        ratingCount: 4102,
      },
      {
        athleteId: "zhao-rui",
        role: "后卫",
        result: "16 分 4 抢断",
        highlight: "防守端连续抢断点燃主场，进攻选择比上轮克制。",
        stats: [
          { label: "抢断", value: "4" },
          { label: "犯规", value: "3" },
          { label: "正负值", value: "+11" },
        ],
        communityAvg: {
          technique: 7.8,
          tactics: 8.0,
          fitness: 8.3,
          mentality: 8.5,
          overall: 8.1,
        },
        ratingCount: 1988,
      },
    ],
  },
  {
    id: "csl-derby",
    slug: "csl-haigang-taishan",
    title: "中超第 12 轮",
    subtitle: "上海海港 vs 山东泰山",
    sport: "football",
    venue: "浦东足球场",
    startAt: "2026-06-07T19:35:00+08:00",
    status: "upcoming",
    cover: "from-sky-800 via-blue-700 to-cyan-500",
    summary:
      "开赛前可以打「预期表现分」。赛后系统会提示你用实际观感覆盖预期，避免赛后滤镜。",
    performances: [
      {
        athleteId: "wu-lei",
        role: "前锋",
        highlight: "近三轮跑动距离回升，但禁区内外的射门选择仍被社区挑剔。",
        stats: [
          { label: "近 3 轮进球", value: "1" },
          { label: "关键传球", value: "4" },
        ],
        communityAvg: {
          technique: 7.6,
          tactics: 7.2,
          fitness: 8.0,
          mentality: 7.9,
          overall: 7.5,
        },
        ratingCount: 640,
      },
      {
        athleteId: "oscar",
        role: "前腰",
        highlight: "节奏发动机。社区关注他能否把中场控制转化成肋部直塞。",
        stats: [
          { label: "场均关键传球", value: "2.4" },
          { label: "传球成功率", value: "87%" },
        ],
        communityAvg: {
          technique: 8.6,
          tactics: 8.8,
          fitness: 7.4,
          mentality: 8.2,
          overall: 8.4,
        },
        ratingCount: 512,
      },
      {
        athleteId: "fellaini",
        role: "中场 / 支点",
        highlight: "定位球和二次进攻仍是泰山的威胁点，跑动覆盖是扣分项。",
        stats: [
          { label: "争顶成功率", value: "68%" },
          { label: "近 5 轮进球", value: "2" },
        ],
        communityAvg: {
          technique: 6.9,
          tactics: 7.3,
          fitness: 6.4,
          mentality: 7.8,
          overall: 7.1,
        },
        ratingCount: 388,
      },
    ],
  },
  {
    id: "wtt-qf",
    slug: "wtt-finals-qf",
    title: "WTT 总决赛女单四分之一决赛",
    subtitle: "孙颖莎 4-2 陈梦",
    sport: "table-tennis",
    venue: "福州海峡奥体中心",
    startAt: "2026-01-09T20:10:00+08:00",
    status: "ended",
    cover: "from-rose-800 via-pink-700 to-red-500",
    summary:
      "六局拉锯。社区把「前三板」和「相持中的线路变化」拆开打分，避免只凭胜负给人贴标签。",
    performances: [
      {
        athleteId: "sun-yingsha",
        role: "女单",
        seed: 1,
        result: "4-2 晋级",
        highlight: "第四局被追平时及时改拧拉落点，决胜局发球变化成为胜负手。",
        stats: [
          { label: "局分", value: "11-8 / 9-11 / 11-7 / 8-11 / 11-6 / 11-9" },
          { label: "发球得分", value: "9" },
        ],
        communityAvg: {
          technique: 9.1,
          tactics: 8.9,
          fitness: 8.4,
          mentality: 9.0,
          overall: 9.0,
        },
        ratingCount: 6210,
      },
      {
        athleteId: "chen-meng",
        role: "女单",
        seed: 3,
        result: "2-4 出局",
        highlight: "相持质量不差，但接发球被限制后进攻发起点变少。输球不等于这场没有高光。",
        stats: [
          { label: "正手得分", value: "18" },
          { label: "无谓失误", value: "16" },
        ],
        communityAvg: {
          technique: 8.3,
          tactics: 7.5,
          fitness: 8.0,
          mentality: 8.1,
          overall: 7.9,
        },
        ratingCount: 4988,
      },
    ],
  },
  {
    id: "diamond-100",
    slug: "diamond-league-100m",
    title: "钻石联赛男子 100 米",
    subtitle: "预赛分组 · 中国飞人同场",
    sport: "athletics",
    venue: "上海体育场",
    startAt: "2026-04-27T20:02:00+08:00",
    status: "live",
    cover: "from-violet-800 via-indigo-700 to-fuchsia-500",
    summary:
      "短跑评分看起跑、途中跑和撞线，不看名气。预赛成绩会写入表现卡，决赛可再评一次。",
    performances: [
      {
        athleteId: "su-bingtian",
        role: "男子 100 米",
        result: "预赛 10.18",
        highlight: "反应时 0.142，前 30 米仍有优势，后程维持一般。",
        stats: [
          { label: "反应时", value: "0.142s" },
          { label: "风速", value: "+0.6" },
        ],
        communityAvg: {
          technique: 8.5,
          tactics: 7.8,
          fitness: 7.6,
          mentality: 8.7,
          overall: 8.2,
        },
        ratingCount: 2740,
      },
      {
        athleteId: "xie-zhenye",
        role: "男子 100 米",
        result: "预赛 10.22",
        highlight: "途中跑放松度好，起跑偏慢。社区在讨论他是否该把重点放在 200 米。",
        stats: [
          { label: "反应时", value: "0.168s" },
          { label: "风速", value: "+0.6" },
        ],
        communityAvg: {
          technique: 8.0,
          tactics: 7.5,
          fitness: 8.1,
          mentality: 7.9,
          overall: 7.8,
        },
        ratingCount: 1511,
      },
    ],
  },
];

export const seedComments: SeedComment[] = [
  {
    id: "c1",
    eventId: "thomas-sf",
    athleteId: "shi-yuqi",
    author: "网前观察员",
    body: "第一局网前搓球质量很高，但第三局开始习惯性起高球，给了对面反击空间。技术分我给到 8.5，体能先扣到 7。",
    createdAt: "2026-05-16T12:06:00+08:00",
    scores: { technique: 8.5, fitness: 7, overall: 8.2 },
  },
  {
    id: "c2",
    eventId: "thomas-sf",
    athleteId: "kodai-naraoka",
    author: "多拍爱好者",
    body: "别只看杀球。他第二局把回合拉长是对的，石宇奇明显开始喘。战术分高于技术分。",
    createdAt: "2026-05-16T12:11:00+08:00",
    scores: { tactics: 8.8, overall: 8.1 },
  },
  {
    id: "c3",
    eventId: "cba-south",
    athleteId: "guo-ailun",
    author: "辽篮看台",
    body: "数据不好看不等于指挥失败。末节被包夹后仍在找内线，失误里有两次是队友没接住。战术我会给 7.5。",
    createdAt: "2026-03-22T21:40:00+08:00",
    scores: { tactics: 7.5, mentality: 7.8, overall: 7.3 },
  },
  {
    id: "c4",
    eventId: "cba-south",
    athleteId: "yi-jianlian",
    author: "内线研究员",
    body: "护筐仍是联盟顶级，但转换回防两次失位很明显。整体 7.8，体能是短板不是态度问题。",
    createdAt: "2026-03-22T21:52:00+08:00",
    scores: { fitness: 6.5, overall: 7.8 },
  },
  {
    id: "c5",
    eventId: "wtt-qf",
    athleteId: "chen-meng",
    author: "相持党",
    body: "输了也能打高分。她相持线路并不差，是接发球被限制后很难主动发起。别用胜负直接打 6 分。",
    createdAt: "2026-01-09T21:28:00+08:00",
    scores: { technique: 8.4, tactics: 7.2, overall: 7.9 },
  },
  {
    id: "c6",
    eventId: "wtt-qf",
    athleteId: "sun-yingsha",
    author: "发球笔记",
    body: "决胜局发球变化是胜负手。整体 9 分我认，但第二局处理短球还是急了。",
    createdAt: "2026-01-09T21:31:00+08:00",
    scores: { overall: 9.0, mentality: 9.1 },
  },
  {
    id: "c7",
    eventId: "diamond-100",
    athleteId: "su-bingtian",
    author: "起跑计时",
    body: "反应时很快，前 30 米仍有优势。后程掉速不能全怪年龄，今天途中跑重心有点晃。",
    createdAt: "2026-04-27T20:08:00+08:00",
    scores: { technique: 8.6, fitness: 7.4, overall: 8.1 },
  },
  {
    id: "c8",
    eventId: "csl-derby",
    athleteId: "wu-lei",
    author: "预期分先记",
    body: "赛前预期：跑动给 8，终结给 7。等开赛后再改，避免被进球滤镜带跑。",
    createdAt: "2026-06-06T21:15:00+08:00",
    scores: { fitness: 8, overall: 7.4 },
  },
];

export function getEvent(slug: string) {
  return events.find((event) => event.slug === slug);
}

export function getAthlete(id: string) {
  return athletes[id];
}

export function performanceKey(eventId: string, athleteId: string) {
  return `${eventId}:${athleteId}`;
}

export function averageScore(scores: { [K in DimensionId]?: number }) {
  const values = DIMENSIONS.map((d) => scores[d.id]).filter(
    (n): n is number => typeof n === "number",
  );
  if (values.length === 0) return 0;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  }).format(new Date(iso));
}
