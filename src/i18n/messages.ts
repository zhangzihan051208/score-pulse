import type { Locale, Sport } from "@/lib/types";

type Dict = {
  brand: string;
  tagline: string;
  common: {
    loadingPage: string;
    loadingSearch: string;
    loadingTeamSearch: string;
    degradedBanner: string;
  };
  nav: {
    home: string;
    boards: string;
    feed: string;
    guide: string;
    profile: string;
    search: string;
  };
  search: {
    title: string;
    lead: string;
    placeholder: string;
    hint: string;
    matches: string;
    players: string;
    clubs: string;
    clubPage: string;
    popularTag: string;
    empty: string;
  };
  team: {
    notFound: string;
    roster: string;
    rosterEmpty: string;
    recent: string;
    upcoming: string;
    honors: string;
    honorsEmpty: string;
    since: string;
    openMatch: string;
  };
  teams: {
    title: string;
    lead: string;
    primary: string;
    secondary: string;
    searchPlaceholder: string;
    clear: string;
    saved: string;
    localHint: string;
    viewSchedule: string;
    fullSchedule: string;
    scheduleEmpty: string;
    noPrimary: string;
    homeTitle: string;
    homeEmpty: string;
    setTeams: string;
    manage: string;
    allFixtures: string;
    noFixturesYet: string;
  };
  profile: {
    title: string;
    lead: string;
    displayName: string;
    displayNameHint: string;
    avatarUrl: string;
    avatarHint: string;
    bio: string;
    bioHint: string;
    save: string;
    saved: string;
    signInRequired: string;
    notConfigured: string;
    levelLabel: string;
    commentsStat: string;
    likesStat: string;
    crestsTitle: string;
    crestsEmpty: string;
    vipEntry: string;
    vipEntryHint: string;
    levelTitles: {
      rookie: string;
      regular: string;
      analyst: string;
      veteran: string;
      legend: string;
    };
  };
  social: {
    like: string;
    reply: string;
    hide: string;
    replyPlaceholder: string;
    sendReply: string;
  };
  vip: {
    title: string;
    badge: string;
    member: string;
    guest: string;
    activeUntil: string;
    benefitFull: string;
    benefitWeight: string;
    quotaLine: string;
    unlimited: string;
    planTitle: string;
    planPrice: string;
    activate: string;
    activated: string;
    demoNote: string;
  };
  auth: {
    signIn: string;
    signOut: string;
    signedIn: string;
    loading: string;
    email: string;
    password: string;
    createAccount: string;
    needAccount: string;
    haveAccount: string;
    lead: string;
    checkEmail: string;
    failed: string;
    notConfigured: string;
    signInToPost: string;
  };
  language: string;
  sports: Record<Sport, string>;
  sportBlurb: Record<Sport, string>;
  status: {
    live: string;
    upcoming: string;
    ended: string;
  };
  home: {
    kicker: string;
    title: string;
    lead: string;
    enter: string;
    hot: string;
    boardsTitle: string;
    matches: string;
    rate: string;
    liveNow: string;
    apiFixtures: string;
    apiFixturesHint: string;
    liveSyncHint: string;
    liveEmpty: string;
    liveBoardLead: string;
    players: string;
    morePlayers: string;
    demoArchive: string;
  };
  board: {
    matches: string;
    dimensions: string;
    dimensionsHint: string;
    empty: string;
    backHome: string;
    allLeagues: string;
  };
  esports: {
    empty: string;
    emptyGame: string;
    dataHint: string;
    dataHintKashrock: string;
  };
  event: {
    ratePlayer: string;
    community: string;
    ratings: string;
    yourScore: string;
    homeSpotlight: string;
    awaySpotlight: string;
    hotTake: string;
    noHotTake: string;
    spotlightEmpty: string;
    spotlightHint: string;
    squadRatings: string;
    squadRatingsLead: string;
    squadRatingsLeadCompact: string;
    squadPlayers: string;
    squadEmpty: string;
    viewPlayer: string;
  };
  rate: {
    title: string;
    back: string;
    community: string;
    yourTake: string;
    comment: string;
    commentHint: string;
    post: string;
    posted: string;
    needComment: string;
    nickname: string;
    saveName: string;
    noComments: string;
    takes: string;
    you: string;
    communityBoard: string;
    filterAll: string;
    filterMine: string;
    filterOthers: string;
    radarLegend: string;
    allRatings: string;
    noCommunityYet: string;
    noCommentsInFilter: string;
    overallWeighted: string;
    scoreOnly: string;
    ratingGuide: string;
    ratingGuideLead: string;
    yourScores: string;
    overallOnly: string;
    overallOnlyHint: string;
    fullQuotaBanner: string;
    fullLimitError: string;
    vipWeightHint: string;
    postComment: string;
    backToPlayer: string;
    detailScores: string;
  };
  feed: {
    title: string;
    lead: string;
    take: string;
    comment: string;
    rating: string;
    empty: string;
  };
  guide: {
    title: string;
    lead: string;
    sections: { title: string; body: string[] }[];
  };
  footer: string;
  notFound: { title: string; body: string; back: string };
  dims: Record<Sport, Record<string, string>>;
};

export const messages: Record<Locale, Dict> = {
  en: {
    brand: "Sideline",
    tagline: "Rate the night, not the reputation",
    common: {
      loadingPage: "Loading…",
      loadingSearch: "Searching…",
      loadingTeamSearch: "Finding teams…",
      degradedBanner:
        "Live data sync is paused (sources slow or offline). Scores come from cache; team search may skip TheSportsDB.",
    },
    nav: {
      home: "Home",
      boards: "Boards",
      feed: "Feed",
      guide: "Guide",
      profile: "Profile",
      search: "Search",
    },
    search: {
      title: "Search",
      lead: "Find a match or player by team name, fixture, or player keyword.",
      placeholder: "Team, match, or player…",
      hint: "At least 2 characters. Searches synced NBA and football fixtures.",
      matches: "Matches",
      players: "Players",
      clubs: "Clubs",
      clubPage: "Team page",
      popularTag: "Hot",
      empty: "No matches or players for that query. Try another spelling or sync fixtures.",
    },
    team: {
      notFound: "We could not load this club. Try search or sync fixtures.",
      roster: "Squad",
      rosterEmpty: "Roster not available from the API for this club yet.",
      recent: "Recent matches",
      upcoming: "Upcoming",
      honors: "Honours & trophies",
      honorsEmpty: "No honours returned for this club (API tier may omit trophies).",
      since: "Since",
      openMatch: "Open match thread",
    },
    teams: {
      title: "My teams",
      lead: "Pick a primary and secondary team in each league board. Home prioritizes your primary team's matches.",
      primary: "Primary team",
      secondary: "Secondary team",
      searchPlaceholder: "Search club name…",
      clear: "Clear",
      saved: "Teams saved",
      localHint: "Saved on this device; sign in to sync across devices.",
      viewSchedule: "Full schedule",
      fullSchedule: "All synced fixtures",
      scheduleEmpty: "No synced fixtures for this team yet. Run a fixtures sync.",
      noPrimary: "Set a primary team for this league first.",
      homeTitle: "Your teams",
      homeEmpty: "Set primary teams to see live and upcoming matches first on the home page.",
      setTeams: "Set my teams",
      manage: "Manage teams",
      allFixtures: "All fixtures",
      noFixturesYet: "No synced matches for your teams yet — try syncing fixtures.",
    },
    profile: {
      title: "Your profile",
      lead: "Nickname, avatar, and signature show on ratings and comments.",
      displayName: "Nickname",
      displayNameHint: "2–32 characters",
      avatarUrl: "Avatar URL",
      avatarHint: "HTTPS link to a square image",
      bio: "Signature",
      bioHint: "Up to 160 characters — optional",
      save: "Save profile",
      saved: "Profile saved",
      signInRequired: "Sign in to edit your profile.",
      notConfigured: "Cloud profiles need Supabase in .env.",
      levelLabel: "Fan level",
      commentsStat: "Comments",
      likesStat: "Likes received",
      crestsTitle: "My teams",
      crestsEmpty: "Set primary teams to show crests here.",
      vipEntry: "Sideline VIP",
      vipEntryHint: "Unlimited five-axis ratings · 2× weight in averages",
      levelTitles: {
        rookie: "Rookie",
        regular: "Regular",
        analyst: "Analyst",
        veteran: "Veteran",
        legend: "Legend",
      },
    },
    social: {
      like: "Like",
      reply: "Reply",
      hide: "Hide",
      replyPlaceholder: "Write a reply…",
      sendReply: "Send",
    },
    vip: {
      title: "Sideline VIP",
      badge: "VIP",
      member: "VIP member",
      guest: "Free member",
      activeUntil: "Valid until",
      benefitFull: "Unlimited five-axis ratings every day",
      benefitWeight: "Your grades count 2× in community averages",
      quotaLine: "Full ratings today: {used} / {limit}",
      unlimited: "Unlimited full ratings",
      planTitle: "Monthly VIP",
      planPrice: "Demo checkout — extends 30 days (no payment in preview)",
      activate: "Activate VIP",
      activated: "VIP activated. Refresh any rating page to unlock full axes.",
      demoNote: "Production can wire Stripe or local payment here.",
    },
    auth: {
      signIn: "Sign in",
      signOut: "Sign out",
      signedIn: "Fan",
      loading: "…",
      email: "Email",
      password: "Password",
      createAccount: "Create account",
      needAccount: "Need an account? Sign up",
      haveAccount: "Already have an account? Sign in",
      lead: "Sign in to save ratings and comments to the cloud.",
      checkEmail: "Check your email to confirm, then sign in.",
      failed: "Something went wrong.",
      notConfigured: "Supabase keys are missing. Add them to .env.local.",
      signInToPost: "Sign in to post your rating to Sideline cloud.",
    },
    language: "Language",
    sports: {
      nba: "NBA",
      soccer: "Soccer",
      esports: "Esports",
      nfl: "NFL",
      f1: "F1",
      tennis: "Tennis",
      ufc: "UFC",
    },
    sportBlurb: {
      nba: "Box score is a start. Grade scoring, defense, playmaking, hustle, clutch.",
      soccer: "Grade the 90: attack, chance creation, defending, work rate, composure.",
      esports:
        "LoL, CS2, Dota 2, Valorant — grade mechanics, macro, impact, consistency, clutch.",
      nfl: "One drive can swing a grade. Execution, physicality, awareness, consistency, clutch.",
      f1: "Lap time is not the whole story. Pace, racecraft, tyres, consistency, composure.",
      tennis: "Hold, break, and the rallies in between. Serve, return, rally, movement, clutch.",
      ufc: "Striking, grappling, cardio, cage control, composure — five numbers after the bell.",
    },
    status: { live: "LIVE", upcoming: "UPCOMING", ended: "FINAL" },
    home: {
      kicker: "International boards",
      title: "Pick a board. Grade a player.",
      lead: "Sideline is a Hupu-style sports forum built around one action: five scores for this match, plus a take on what you actually saw. Overseas leagues first.",
      enter: "Enter board",
      hot: "Hot now",
      boardsTitle: "Boards",
      matches: "matches",
      rate: "Rate",
      liveNow: "Live games",
      apiFixtures: "From TheSportsDB",
      apiFixturesHint:
        "Live NBA & Premier League threads refresh from TheSportsDB every ~90s.",
      liveSyncHint: "Live scores refresh faster; background tabs poll less often.",
      liveEmpty:
        "No live threads yet. Set Supabase service key and run sync, or wait for the next poll.",
      liveBoardLead:
        "Real recent matches with full squads from TheSportsDB — rate any listed player.",
      players: "players",
      morePlayers: "more on the thread",
      demoArchive: "demo archive",
    },
    board: {
      matches: "Match threads",
      dimensions: "Grades by role",
      dimensionsHint:
        "Each position has its own five axes. Overall is weighted for that role, not a flat average.",
      empty: "No matches in this filter.",
      backHome: "All boards",
      allLeagues: "All leagues",
    },
    esports: {
      empty:
        "No matches for this game right now. Wait a moment and refresh, or open another game tab.",
      emptyGame: "No matches in this game right now — try again in a minute.",
      dataHint: "Schedules from PandaScore · cached ~45s · live threads poll faster.",
      dataHintKashrock:
        "Schedules from KashRock · grouped by game · Sandbox 20 req/min · cached ~30s.",
    },
    event: {
      ratePlayer: "Grade",
      community: "Board average",
      ratings: "ratings",
      yourScore: "Your card",
      homeSpotlight: "Home spotlight",
      awaySpotlight: "Away spotlight",
      hotTake: "Hot take",
      noHotTake: "No standout comment yet — open the card to post one.",
      spotlightEmpty: "No spotlight players yet. Sync lineups or grade someone first.",
      spotlightHint: "Spotlight picks for this thread · {n} players on the card",
      squadRatings: "Squad ratings",
      squadRatingsLead: "Community averages by player — home and away.",
      squadRatingsLeadCompact: "Tap a player for full grades and every take. Switch teams below.",
      squadPlayers: "players",
      squadEmpty: "No lineup for this side yet.",
      viewPlayer: "View card",
    },
    rate: {
      title: "Player card",
      back: "Match thread",
      community: "Board avg",
      yourTake: "Your five",
      comment: "Your take",
      commentHint: "One concrete play. Skip the win/loss shouting.",
      post: "Post rating",
      posted: "Saved on this device.",
      needComment: "Write at least 8 characters, or leave the take blank.",
      nickname: "Handle",
      saveName: "Save",
      noComments: "No takes yet. Be the first.",
      takes: "Takes",
      you: "You",
      communityBoard: "Community grades",
      filterAll: "All",
      filterMine: "Mine",
      filterOthers: "Others",
      radarLegend: "Orange = community avg · Blue = your card",
      allRatings: "Every rating",
      noCommunityYet: "No cloud ratings yet. Sign in and post the first card.",
      noCommentsInFilter: "No comments in this filter.",
      overallWeighted: "Overall uses role weights (see scoring guide below).",
      scoreOnly: "Score only — no written take.",
      ratingGuide: "Scoring guide",
      ratingGuideLead:
        "Five axes for {role} — weighted into the overall score:",
      yourScores: "Your five axes",
      overallOnly: "Overall only",
      overallOnlyHint:
        "Free members get {limit} full five-axis cards per day (UTC). Overall-only ratings are unlimited.",
      fullQuotaBanner:
        "Today’s full cards used ({used}/{limit}). Slide overall below, or upgrade to VIP on your profile.",
      fullLimitError:
        "Daily full rating limit reached. Use overall-only or activate VIP in Profile.",
      vipWeightHint: "VIP members’ ratings count double in board averages.",
      postComment: "Post rating & comment",
      backToPlayer: "Back to player card",
      detailScores: "Community breakdown",
    },
    feed: {
      title: "Feed",
      lead: "Ratings and takes from every board, newest first.",
      take: "Card",
      comment: "Take",
      rating: "Rating",
      empty: "Nothing here yet. Grade a player.",
    },
    guide: {
      title: "How to run this",
      lead: "Same product as a Hupu-style board: sport rooms first, one simple rating card, five grades that change by sport.",
      sections: [
        {
          title: "Boards, not a blob",
          body: [
            "Home should open into NBA, Soccer, NFL, F1, Tennis, UFC — not a mixed pile of matches.",
            "Each board keeps the same rating layout so users never relearn the UI.",
          ],
        },
        {
          title: "Five grades, position-specific",
          body: [
            "Keep exactly five sliders. Labels and weights change by role (e.g. striker vs keeper, guard vs center).",
            "Overall is a weighted sum for that position — not a flat average of the five.",
          ],
        },
        {
          title: "Overseas first",
          body: [
            "Ship English as the default. Add Chinese, Spanish, Japanese for the same boards.",
            "Player names stay in their common Latin form; UI and takes localize.",
          ],
        },
      ],
    },
    footer: "Sideline · Prototype. Ratings stay in your browser. No account required.",
    notFound: {
      title: "Thread not found",
      body: "This match or player is not on the board.",
      back: "Back to boards",
    },
    dims: {
      nba: {
        scoring: "Scoring",
        defense: "Defense",
        playmaking: "Playmaking",
        hustle: "Hustle",
        clutch: "Clutch",
      },
      soccer: {
        attack: "Attack",
        creation: "Creation",
        defending: "Defending",
        workrate: "Work rate",
        composure: "Composure",
      },
      esports: {
        mechanics: "Mechanics",
        macro: "Macro",
        impact: "Impact",
        consistency: "Consistency",
        clutch: "Clutch",
      },
      nfl: {
        execution: "Execution",
        physicality: "Physicality",
        awareness: "Awareness",
        consistency: "Consistency",
        clutch: "Clutch",
      },
      f1: {
        pace: "Pace",
        racecraft: "Racecraft",
        tyres: "Tyres",
        consistency: "Consistency",
        composure: "Composure",
      },
      tennis: {
        serve: "Serve",
        return: "Return",
        rally: "Rally",
        movement: "Movement",
        clutch: "Clutch",
      },
      ufc: {
        striking: "Striking",
        grappling: "Grappling",
        cardio: "Cardio",
        control: "Control",
        composure: "Composure",
      },
    },
  },
  zh: {
    brand: "Sideline",
    tagline: "评这场，而不是评名气",
    common: {
      loadingPage: "加载中…",
      loadingSearch: "正在搜索…",
      loadingTeamSearch: "正在查找球队…",
      degradedBanner:
        "实时同步已暂停（数据源较慢或不可用），比分来自本地缓存；球队搜索可能仅用已同步数据。",
    },
    nav: {
      home: "首页",
      boards: "分区",
      feed: "动态",
      guide: "手册",
      profile: "我的",
      search: "搜索",
    },
    search: {
      title: "搜索",
      lead: "用球队、比赛或球员关键词查找。",
      placeholder: "球队、比赛或球员…",
      hint: "至少 2 个字。搜索已同步的 NBA 与足球赛程。",
      matches: "比赛",
      players: "球员",
      clubs: "球队",
      clubPage: "球队主页",
      popularTag: "热门",
      empty: "没有结果，换个关键词或先同步赛程。",
    },
    team: {
      notFound: "无法加载该球队，请搜索或同步赛程。",
      roster: "阵容",
      rosterEmpty: "API 暂未返回该队阵容。",
      recent: "最近比赛",
      upcoming: "即将开赛",
      honors: "历史荣誉",
      honorsEmpty: "暂无荣誉数据（可能与 API 套餐有关）。",
      since: "成立于",
      openMatch: "进入比赛帖",
    },
    teams: {
      title: "我的主队",
      lead: "每个联赛分区可设一支主队、一支副队。首页优先展示主队比赛。",
      primary: "主队",
      secondary: "副队",
      searchPlaceholder: "搜索球队…",
      clear: "清除",
      saved: "已保存",
      localHint: "保存在本机；登录后可云端同步。",
      viewSchedule: "全部赛程",
      fullSchedule: "已同步的全部比赛",
      scheduleEmpty: "暂无该队赛程，请先同步 fixtures。",
      noPrimary: "请先在本分区设置主队。",
      homeTitle: "我的主队",
      homeEmpty: "设置主队后，首页会优先显示主队的进行中与即将开赛比赛。",
      setTeams: "去设置主队",
      manage: "管理主队",
      allFixtures: "全部赛程",
      noFixturesYet: "还没有主队的同步比赛，请先同步赛程。",
    },
    profile: {
      title: "个人主页",
      lead: "昵称、头像和签名会显示在评分与评论中。",
      displayName: "昵称",
      displayNameHint: "2–32 个字符",
      avatarUrl: "头像链接",
      avatarHint: "HTTPS 图片地址",
      bio: "个人签名",
      bioHint: "最多 160 字，可选",
      save: "保存资料",
      saved: "已保存",
      signInRequired: "登录后可编辑个人主页。",
      notConfigured: "需在 .env 中配置 Supabase。",
      levelLabel: "球迷等级",
      commentsStat: "评论",
      likesStat: "获赞",
      crestsTitle: "我的主队",
      crestsEmpty: "在「我的主队」里设置后会显示队徽。",
      vipEntry: "Sideline VIP",
      vipEntryHint: "五维详评不限次 · 均分权重 ×2",
      levelTitles: {
        rookie: "新秀",
        regular: "常客",
        analyst: "分析师",
        veteran: "老炮",
        legend: "传奇",
      },
    },
    social: {
      like: "赞",
      reply: "回复",
      hide: "隐藏",
      replyPlaceholder: "写回复…",
      sendReply: "发送",
    },
    vip: {
      title: "Sideline VIP",
      badge: "VIP",
      member: "VIP 会员",
      guest: "普通会员",
      activeUntil: "有效期至",
      benefitFull: "五维详细评分每日不限次数",
      benefitWeight: "你的评分在选手均分里权重 ×2",
      quotaLine: "今日五维名额：{used} / {limit}",
      unlimited: "五维评分不限次",
      planTitle: "月度 VIP",
      planPrice: "演示开通 — 延长 30 天（预览环境无需付款）",
      activate: "开通 VIP",
      activated: "VIP 已开通，刷新评分页即可无限五维打分。",
      demoNote: "正式环境可在此接入 Stripe 或本地支付。",
    },
    auth: {
      signIn: "登录",
      signOut: "退出",
      signedIn: "球迷",
      loading: "…",
      email: "邮箱",
      password: "密码",
      createAccount: "注册",
      needAccount: "没有账号？注册",
      haveAccount: "已有账号？登录",
      lead: "登录后评分与评论会保存到云端。",
      checkEmail: "请查收确认邮件后再登录。",
      failed: "出错了。",
      notConfigured: "未配置 Supabase，请在 .env.local 添加密钥。",
      signInToPost: "登录后再提交评分到云端。",
    },
    language: "语言",
    sports: {
      nba: "NBA",
      soccer: "足球",
      esports: "电竞",
      nfl: "NFL",
      f1: "F1",
      tennis: "网球",
      ufc: "UFC",
    },
    sportBlurb: {
      nba: "得分、防守、组织、拼劲、关键球。数据只是起点。",
      soccer: "进攻、做戏、防守、跑动、心态。给满 90 分钟。",
      esports: "英雄联盟、CS2、Dota 2、无畏契约 — 操作、大局、影响力、稳定性、关键局。",
      nfl: "执行、身体对抗、阅读、稳定性、关键回合。",
      f1: "圈速、车轮战、轮胎、稳定性、心态。",
      tennis: "发球、接发、相持、移动、关键分。",
      ufc: "打击、地面、体能、控制、冷静。铃响后打五个分。",
    },
    status: { live: "进行中", upcoming: "未开赛", ended: "已结束" },
    home: {
      kicker: "海外赛事分区",
      title: "先选分区，再给球员打分",
      lead: "Sideline 做成虎扑式看台：首页按 NBA、足球、NFL、F1、网球、UFC 分区。同一套打分卡，五个指标随项目变化。默认面向海外联赛。",
      enter: "进入分区",
      hot: "正在热评",
      boardsTitle: "赛事分区",
      matches: "场比赛",
      rate: "打分",
      liveNow: "进行中",
      apiFixtures: "TheSportsDB 赛程",
      apiFixturesHint: "NBA 与英超真实赛程约每 90 秒自动刷新。",
      liveSyncHint: "进行中比赛刷新更快；切到后台会降低轮询频率。",
      liveEmpty: "暂无真实赛程。请配置 Supabase 服务端密钥并等待同步。",
      liveBoardLead: "TheSportsDB 最近比赛与阵容，可为名单中任意球员打分。",
      players: "名球员",
      morePlayers: "人见比赛帖",
      demoArchive: "演示归档",
    },
    board: {
      matches: "比赛帖",
      dimensions: "按位置五维",
      dimensionsHint: "不同位置有五项独立维度；总分按该位置权重加权，不是简单平均。",
      empty: "没有符合筛选的比赛。",
      backHome: "全部分区",
      allLeagues: "全部联赛",
    },
    esports: {
      empty: "该游戏暂无赛程，请稍候刷新或切换其他游戏标签。",
      emptyGame: "该分类暂无比赛，请稍后再试。",
      dataHint: "赛程来自 PandaScore · 约 45 秒缓存 · 进行中比赛刷新更快。",
      dataHintKashrock:
        "赛程来自 KashRock · 按游戏分类展示 · Sandbox 20 次/分钟 · 约 30 秒缓存。",
    },
    event: {
      ratePlayer: "去打分",
      community: "分区均分",
      ratings: "人评",
      yourScore: "你的卡",
      homeSpotlight: "主队代表",
      awaySpotlight: "客队代表",
      hotTake: "热评",
      noHotTake: "还没有热评，点进球员卡来一条。",
      spotlightEmpty: "暂无代表球员，请先同步阵容或给球员打分。",
      spotlightHint: "本场各队代表 · 阵容共 {n} 人可评",
      squadRatings: "全员评分",
      squadRatingsLead: "主客队分栏展示社区均分与五维分布。",
      squadRatingsLeadCompact: "点球员看详细评分与全部短评；下方切换主客队。",
      squadPlayers: "人",
      squadEmpty: "该队暂无阵容数据。",
      viewPlayer: "查看球员卡",
    },
    rate: {
      title: "球员卡",
      back: "返回比赛",
      community: "分区均分",
      yourTake: "你的五维",
      comment: "短评",
      commentHint: "写一个具体回合，别只喊赢了输了。",
      post: "提交评分",
      posted: "已保存在这台设备。",
      needComment: "短评至少 8 个字，也可以留空只打分。",
      nickname: "昵称",
      saveName: "保存",
      noComments: "还没有短评。",
      takes: "短评",
      you: "我",
      communityBoard: "社区评分",
      filterAll: "全部",
      filterMine: "我的",
      filterOthers: "他人",
      radarLegend: "橙色 = 社区均分 · 蓝色 = 你的评分",
      allRatings: "全部评分卡",
      noCommunityYet: "还没有云端评分，登录后发布第一条。",
      noCommentsInFilter: "该筛选下暂无评论。",
      overallWeighted: "总分为该位置加权（见下方评分须知）。",
      ratingGuide: "评分须知",
      ratingGuideLead: "本场按「{role}」五个维度打分，权重合成总分：",
      yourScores: "你的五维打分",
      overallOnly: "仅总评",
      overallOnlyHint:
        "普通会员每天（UTC）最多 {limit} 次五维详评；仅总评不限次数。",
      fullQuotaBanner:
        "今日五维名额已用完（{used}/{limit}）。请用下方总评，或在个人主页开通 VIP。",
      fullLimitError: "今日五维名额已满。请改用总评，或在个人主页开通 VIP。",
      vipWeightHint: "VIP 会员的评分在选手均分中计为 2 倍权重。",
      scoreOnly: "仅评分，未写短评。",
      postComment: "发布评分与短评",
      backToPlayer: "返回球员卡",
      detailScores: "社区均分明细",
    },
    feed: {
      title: "动态",
      lead: "全分区的评分和短评，最新在上。",
      take: "评分卡",
      comment: "短评",
      rating: "评分",
      empty: "还没有动态。先去给球员打分。",
    },
    guide: {
      title: "怎么做、准备什么",
      lead: "虎扑式分区 + 一张统一的打分卡 + 按项目切换的五维。面向海外，多语言是默认能力。",
      sections: [
        {
          title: "先分区，再内容",
          body: [
            "首页点进 NBA / 足球 / NFL / F1 / 网球 / UFC，不要把所有比赛堆在一页。",
            "每个分区的打分页布局必须一样，用户不用重新学。",
          ],
        },
        {
          title: "五维按项目换，控件不换",
          body: [
            "永远五个滑杆。只换名称。总分用平均，不再加第六项。",
            "NBA 和 UFC 如果共用「技术/战术」，分数会失去意义。",
          ],
        },
        {
          title: "海外赛事为主，语言跟上",
          body: [
            "默认英语。同一套分区提供中文、西语、日语。",
            "球员名保持国际通行写法，界面和短评随语言切换。",
          ],
        },
      ],
    },
    footer: "Sideline · 原型。评分存在浏览器本地，无需登录。",
    notFound: {
      title: "帖子不存在",
      body: "这场或这名球员不在分区里。",
      back: "返回分区",
    },
    dims: {
      nba: {
        scoring: "得分",
        defense: "防守",
        playmaking: "组织",
        hustle: "拼劲",
        clutch: "关键球",
      },
      soccer: {
        attack: "进攻",
        creation: "做戏",
        defending: "防守",
        workrate: "跑动",
        composure: "心态",
      },
      esports: {
        mechanics: "操作",
        macro: "大局",
        impact: "影响力",
        consistency: "稳定性",
        clutch: "关键局",
      },
      nfl: {
        execution: "执行",
        physicality: "对抗",
        awareness: "阅读",
        consistency: "稳定",
        clutch: "关键",
      },
      f1: {
        pace: "圈速",
        racecraft: "车轮战",
        tyres: "轮胎",
        consistency: "稳定",
        composure: "心态",
      },
      tennis: {
        serve: "发球",
        return: "接发",
        rally: "相持",
        movement: "移动",
        clutch: "关键分",
      },
      ufc: {
        striking: "打击",
        grappling: "地面",
        cardio: "体能",
        control: "控制",
        composure: "冷静",
      },
    },
  },
  es: {
    brand: "Sideline",
    tagline: "Nota la noche, no la fama",
    common: {
      loadingPage: "Cargando…",
      loadingSearch: "Buscando…",
      loadingTeamSearch: "Buscando equipos…",
      degradedBanner:
        "Sincronización en vivo pausada; marcadores desde caché. Búsqueda de clubes puede omitir TheSportsDB.",
    },
    nav: {
      home: "Inicio",
      boards: "Tablones",
      feed: "Feed",
      guide: "Guía",
      profile: "Perfil",
      search: "Buscar",
    },
    search: {
      title: "Buscar",
      lead: "Encuentra partidos o jugadores por equipo, partido o nombre.",
      placeholder: "Equipo, partido o jugador…",
      hint: "Mínimo 2 caracteres. NBA y fútbol sincronizados.",
      matches: "Partidos",
      players: "Jugadores",
      clubs: "Clubes",
      clubPage: "Ficha del club",
      popularTag: "Top",
      empty: "Sin resultados. Prueba otra búsqueda o sincroniza.",
    },
    team: {
      notFound: "No pudimos cargar este club.",
      roster: "Plantilla",
      rosterEmpty: "Plantilla no disponible en la API.",
      recent: "Partidos recientes",
      upcoming: "Próximos",
      honors: "Palmarés",
      honorsEmpty: "Sin trofeos en la API para este club.",
      since: "Desde",
      openMatch: "Ver hilo del partido",
    },
    teams: {
      title: "Mis equipos",
      lead: "Elige equipo principal y secundario por liga. Inicio prioriza al principal.",
      primary: "Principal",
      secondary: "Secundario",
      searchPlaceholder: "Buscar club…",
      clear: "Quitar",
      saved: "Guardado",
      localHint: "En este dispositivo; inicia sesión para sincronizar.",
      viewSchedule: "Calendario completo",
      fullSchedule: "Partidos sincronizados",
      scheduleEmpty: "Sin partidos sincronizados para este equipo.",
      noPrimary: "Configura primero el equipo principal.",
      homeTitle: "Tus equipos",
      homeEmpty: "Configura equipos para ver sus partidos primero en inicio.",
      setTeams: "Configurar equipos",
      manage: "Gestionar",
      allFixtures: "Todos los partidos",
      noFixturesYet: "Aún no hay partidos sincronizados para tus equipos.",
    },
    profile: {
      title: "Tu perfil",
      lead: "Nick, avatar y firma aparecen en tus notas.",
      displayName: "Nick",
      displayNameHint: "2–32 caracteres",
      avatarUrl: "URL del avatar",
      avatarHint: "Enlace HTTPS a una imagen",
      bio: "Firma",
      bioHint: "Hasta 160 caracteres, opcional",
      save: "Guardar perfil",
      saved: "Perfil guardado",
      signInRequired: "Inicia sesión para editar tu perfil.",
      notConfigured: "Configura Supabase en .env.",
      levelLabel: "Nivel de fan",
      commentsStat: "Comentarios",
      likesStat: "Me gusta",
      crestsTitle: "Mis equipos",
      crestsEmpty: "Configura equipos para ver escudos aquí.",
      vipEntry: "Sideline VIP",
      vipEntryHint: "Notas de cinco ejes ilimitadas · peso ×2",
      levelTitles: {
        rookie: "Novato",
        regular: "Habitual",
        analyst: "Analista",
        veteran: "Veterano",
        legend: "Leyenda",
      },
    },
    social: {
      like: "Me gusta",
      reply: "Responder",
      hide: "Ocultar",
      replyPlaceholder: "Escribe una respuesta…",
      sendReply: "Enviar",
    },
    vip: {
      title: "Sideline VIP",
      badge: "VIP",
      member: "Miembro VIP",
      guest: "Miembro gratis",
      activeUntil: "Válido hasta",
      benefitFull: "Notas de cinco ejes ilimitadas al día",
      benefitWeight: "Tus notas cuentan ×2 en la media",
      quotaLine: "Notas completas hoy: {used} / {limit}",
      unlimited: "Notas completas ilimitadas",
      planTitle: "VIP mensual",
      planPrice: "Demo — +30 días (sin pago en vista previa)",
      activate: "Activar VIP",
      activated: "VIP activado. Recarga la página de notas.",
      demoNote: "En producción conecta Stripe aquí.",
    },
    auth: {
      signIn: "Entrar",
      signOut: "Salir",
      signedIn: "Fan",
      loading: "…",
      email: "Correo",
      password: "Contraseña",
      createAccount: "Crear cuenta",
      needAccount: "¿Sin cuenta? Regístrate",
      haveAccount: "¿Ya tienes cuenta? Entra",
      lead: "Inicia sesión para guardar notas en la nube.",
      checkEmail: "Revisa tu correo para confirmar.",
      failed: "Algo falló.",
      notConfigured: "Faltan claves de Supabase en .env.local.",
      signInToPost: "Inicia sesión para publicar tu nota.",
    },
    language: "Idioma",
    sports: {
      nba: "NBA",
      soccer: "Fútbol",
      esports: "Esports",
      nfl: "NFL",
      f1: "F1",
      tennis: "Tenis",
      ufc: "UFC",
    },
    sportBlurb: {
      nba: "Anota, defiende, crea, pelea, clutch. El box score es el inicio.",
      soccer: "Ataque, creación, defensa, trabajo, temple. Los 90 minutos.",
      esports: "LoL, CS2, Dota 2, Valorant — mecánica, macro, impacto, consistencia, clutch.",
      nfl: "Ejecución, físico, lectura, consistencia, clutch.",
      f1: "Ritmo, batalla, neumáticos, consistencia, temple.",
      tennis: "Saque, resto, peloteo, movimiento, puntos clave.",
      ufc: "Golpeo, grappling, cardio, control, temple.",
    },
    status: { live: "EN VIVO", upcoming: "PRÓXIMO", ended: "FINAL" },
    home: {
      kicker: "Tablones internacionales",
      title: "Elige tablón. Puntúa al jugador.",
      lead: "Sideline es un foro estilo Hupu: primero el deporte, luego cinco notas de este partido y un comentario de lo que viste. Ligas de ultramar primero.",
      enter: "Entrar",
      hot: "Ahora",
      boardsTitle: "Tablones",
      matches: "partidos",
      rate: "Puntuar",
      liveNow: "En vivo",
      apiFixtures: "TheSportsDB",
      apiFixturesHint: "NBA y Premier League se actualizan cada ~90 s.",
      liveSyncHint: "Partidos en vivo se actualizan más a menudo; en segundo plano, menos.",
      liveEmpty: "Sin partidos reales aún. Configura Supabase service key.",
      liveBoardLead: "Partidos recientes y plantillas completas desde TheSportsDB.",
      players: "jugadores",
      morePlayers: "más en el hilo",
      demoArchive: "demo",
    },
    board: {
      matches: "Hilos",
      dimensions: "Notas por rol",
      dimensionsHint:
        "Cada posición tiene cinco ejes propios. La nota global es ponderada, no un promedio plano.",
      empty: "No hay partidos en este filtro.",
      backHome: "Todos",
      allLeagues: "Todas las ligas",
    },
    esports: {
      empty:
        "No hay partidos para este juego ahora. Espera un momento o prueba otra pestaña.",
      emptyGame: "Sin partidos en esta categoría — inténtalo de nuevo en un minuto.",
      dataHint: "Calendario de PandaScore · caché ~45 s · en vivo se actualiza más rápido.",
      dataHintKashrock:
        "Calendario KashRock · por juego · Sandbox 20 req/min · caché ~30 s.",
    },
    event: {
      ratePlayer: "Puntuar",
      community: "Media",
      ratings: "votos",
      yourScore: "Tu carta",
      homeSpotlight: "Local",
      awaySpotlight: "Visitante",
      hotTake: "Comentario top",
      noHotTake: "Aún no hay comentario destacado.",
      spotlightEmpty: "Sin jugadores destacados todavía.",
      spotlightHint: "Destacados del partido · {n} jugadores en la ficha",
      squadRatings: "Notas del plantel",
      squadRatingsLead: "Medias de la comunidad, local y visitante.",
      squadRatingsLeadCompact: "Toca un jugador para ver notas y comentarios. Cambia de equipo abajo.",
      squadPlayers: "jugadores",
      squadEmpty: "Sin alineación para este bando.",
      viewPlayer: "Ver ficha",
    },
    rate: {
      title: "Carta",
      back: "Hilo",
      community: "Media",
      yourTake: "Tus cinco",
      comment: "Comentario",
      commentHint: "Una jugada concreta. Sin gritar victoria o derrota.",
      post: "Publicar",
      posted: "Guardado en este dispositivo.",
      needComment: "Al menos 8 caracteres, o déjalo vacío.",
      nickname: "Nick",
      saveName: "Guardar",
      noComments: "Aún no hay comentarios.",
      takes: "Comentarios",
      you: "Tú",
      communityBoard: "Notas de la comunidad",
      filterAll: "Todos",
      filterMine: "Mías",
      filterOthers: "Otros",
      radarLegend: "Naranja = media · Azul = tu tarjeta",
      allRatings: "Cada nota",
      noCommunityYet: "Aún no hay notas en la nube.",
      noCommentsInFilter: "Sin comentarios en este filtro.",
      overallWeighted: "La nota global usa pesos del rol (ver guía abajo).",
      ratingGuide: "Guía de notas",
      ratingGuideLead: "Cinco ejes para {role}, ponderados en la nota global:",
      yourScores: "Tus cinco ejes",
      overallOnly: "Solo global",
      overallOnlyHint:
        "Gratis: {limit} fichas de cinco ejes al día (UTC). Global ilimitado.",
      fullQuotaBanner:
        "Límite diario de fichas completas ({used}/{limit}). Usa global o VIP en perfil.",
      fullLimitError: "Límite diario alcanzado. Usa solo global o activa VIP.",
      vipWeightHint: "Las notas VIP cuentan doble en la media.",
      scoreOnly: "Solo nota numérica, sin texto.",
      postComment: "Publicar nota y comentario",
      backToPlayer: "Volver a la ficha",
      detailScores: "Desglose de la comunidad",
    },
    feed: {
      title: "Feed",
      lead: "Notas y comentarios de todos los tablones.",
      take: "Ficha",
      comment: "Take",
      rating: "Nota",
      empty: "Nada aún. Puntúa a un jugador.",
    },
    guide: {
      title: "Cómo montarlo",
      lead: "Tablones por deporte, una tarjeta de nota simple, cinco ejes distintos por disciplina. Producto global.",
      sections: [
        {
          title: "Tablones, no un cajón",
          body: [
            "La home entra a NBA, fútbol, NFL, F1, tenis, UFC.",
            "La pantalla de nota es la misma en todos los tablones.",
          ],
        },
        {
          title: "Cinco notas, ejes distintos",
          body: [
            "Siempre cinco deslizadores. Solo cambian las etiquetas. La media es el overall.",
            "NBA no es UFC. Ejes genéricos = ruido.",
          ],
        },
        {
          title: "Ultramar primero",
          body: [
            "Inglés por defecto. Chino, español y japonés sobre los mismos tablones.",
            "Los nombres de jugadores se quedan en forma internacional.",
          ],
        },
      ],
    },
    footer: "Sideline · Prototipo. Las notas viven en tu navegador.",
    notFound: {
      title: "Hilo no encontrado",
      body: "Este partido o jugador no está en el tablón.",
      back: "Volver",
    },
    dims: {
      nba: {
        scoring: "Anotación",
        defense: "Defensa",
        playmaking: "Creación",
        hustle: "Intensidad",
        clutch: "Clutch",
      },
      soccer: {
        attack: "Ataque",
        creation: "Creación",
        defending: "Defensa",
        workrate: "Trabajo",
        composure: "Temple",
      },
      esports: {
        mechanics: "Mecánica",
        macro: "Macro",
        impact: "Impacto",
        consistency: "Consistencia",
        clutch: "Clutch",
      },
      nfl: {
        execution: "Ejecución",
        physicality: "Físico",
        awareness: "Lectura",
        consistency: "Consistencia",
        clutch: "Clutch",
      },
      f1: {
        pace: "Ritmo",
        racecraft: "Batalla",
        tyres: "Neumáticos",
        consistency: "Consistencia",
        composure: "Temple",
      },
      tennis: {
        serve: "Saque",
        return: "Resto",
        rally: "Peloteo",
        movement: "Movimiento",
        clutch: "Clutch",
      },
      ufc: {
        striking: "Golpeo",
        grappling: "Suelo",
        cardio: "Cardio",
        control: "Control",
        composure: "Temple",
      },
    },
  },
  ja: {
    brand: "Sideline",
    tagline: "名声ではなく、この一戦を採点する",
    common: {
      loadingPage: "読み込み中…",
      loadingSearch: "検索中…",
      loadingTeamSearch: "チームを検索中…",
      degradedBanner:
        "ライブ同期を一時停止中。スコアはキャッシュ表示。クラブ検索は同期済みデータのみの場合があります。",
    },
    nav: {
      home: "ホーム",
      boards: "板",
      feed: "フィード",
      guide: "ガイド",
      profile: "プロフィール",
      search: "検索",
    },
    search: {
      title: "検索",
      lead: "チーム・試合・選手名で探す。",
      placeholder: "チーム、試合、選手…",
      hint: "2文字以上。同期済み NBA・サッカーが対象。",
      matches: "試合",
      players: "選手",
      clubs: "クラブ",
      clubPage: "チームページ",
      popularTag: "人気",
      empty: "該当なし。別のキーワードか同期を試してください。",
    },
    team: {
      notFound: "このクラブを読み込めませんでした。",
      roster: "メンバー",
      rosterEmpty: "API からメンバー情報がありません。",
      recent: "最近の試合",
      upcoming: "これから",
      honors: "タイトル・荣誉",
      honorsEmpty: "荣誉データがありません。",
      since: "創設",
      openMatch: "試合スレッドへ",
    },
    teams: {
      title: "マイチーム",
      lead: "リーグごとに主・副チームを設定。ホームで主チームの試合を優先表示。",
      primary: "主チーム",
      secondary: "副チーム",
      searchPlaceholder: "クラブを検索…",
      clear: "解除",
      saved: "保存しました",
      localHint: "この端末に保存。ログインでクラウド同期。",
      viewSchedule: "全日程",
      fullSchedule: "同期済みの全試合",
      scheduleEmpty: "このチームの同期試合がありません。",
      noPrimary: "先に主チームを設定してください。",
      homeTitle: "マイチーム",
      homeEmpty: "主チームを設定すると、ホームでその試合が優先表示されます。",
      setTeams: "チームを設定",
      manage: "管理",
      allFixtures: "全試合",
      noFixturesYet: "主チームの同期試合がまだありません。",
    },
    profile: {
      title: "プロフィール",
      lead: "ニックネーム・アバター・署名が採点に表示されます。",
      displayName: "ニックネーム",
      displayNameHint: "2〜32文字",
      avatarUrl: "アバター URL",
      avatarHint: "HTTPS の画像リンク",
      bio: "署名",
      bioHint: "160文字まで（任意）",
      save: "保存",
      saved: "保存しました",
      signInRequired: "編集するにはログインしてください。",
      notConfigured: ".env に Supabase を設定してください。",
      levelLabel: "ファンレベル",
      commentsStat: "コメント",
      likesStat: "いいね",
      crestsTitle: "マイチーム",
      crestsEmpty: "マイチームで設定するとエンブレムが表示されます。",
      vipEntry: "Sideline VIP",
      vipEntryHint: "五軸無制限 · 平均で 2 倍の重み",
      levelTitles: {
        rookie: "ルーキー",
        regular: "レギュラー",
        analyst: "アナリスト",
        veteran: "ベテラン",
        legend: "レジェンド",
      },
    },
    social: {
      like: "いいね",
      reply: "返信",
      hide: "非表示",
      replyPlaceholder: "返信を書く…",
      sendReply: "送信",
    },
    vip: {
      title: "Sideline VIP",
      badge: "VIP",
      member: "VIP 会員",
      guest: "無料会員",
      activeUntil: "有効期限",
      benefitFull: "五軸の詳細採点が毎日無制限",
      benefitWeight: "あなたの採点は平均に 2 倍の重み",
      quotaLine: "本日の五軸：{used} / {limit}",
      unlimited: "五軸採点無制限",
      planTitle: "月額 VIP",
      planPrice: "デモ — 30 日延長（プレビューでは決済なし）",
      activate: "VIP を有効化",
      activated: "VIP を有効化しました。採点ページを更新してください。",
      demoNote: "本番では Stripe 等を接続できます。",
    },
    auth: {
      signIn: "ログイン",
      signOut: "ログアウト",
      signedIn: "ファン",
      loading: "…",
      email: "メール",
      password: "パスワード",
      createAccount: "アカウント作成",
      needAccount: "アカウント作成はこちら",
      haveAccount: "ログインはこちら",
      lead: "ログインすると採点とコメントがクラウドに保存されます。",
      checkEmail: "確認メールをチェックしてください。",
      failed: "エラーが発生しました。",
      notConfigured: "Supabase のキーを .env.local に設定してください。",
      signInToPost: "投稿するにはログインしてください。",
    },
    language: "言語",
    sports: {
      nba: "NBA",
      soccer: "サッカー",
      esports: "eスポーツ",
      nfl: "NFL",
      f1: "F1",
      tennis: "テニス",
      ufc: "UFC",
    },
    sportBlurb: {
      nba: "得点・守備・組み立て・ハッスル・クラッチ。",
      soccer: "攻撃・創造・守備・運動量・冷静さ。",
      esports: "LoL・CS2・Dota2・Valorant — 操作・マクロ・インパクト・安定・クラッチ。",
      nfl: "遂行・フィジカル・判断・安定・クラッチ。",
      f1: "ペース・レースクラフト・タイヤ・安定・冷静さ。",
      tennis: "サーブ・リターン・ラリー・ムーブ・クラッチ。",
      ufc: "打撃・グラップリング・心肺・コントロール・冷静さ。",
    },
    status: { live: "LIVE", upcoming: "予定", ended: "終了" },
    home: {
      kicker: "海外リーグの板",
      title: "板を選んで、選手を採点する",
      lead: "Sideline は虎扑型のスポーツ板。NBA・サッカー・NFL・F1・テニス・UFC。同じ採点カードで、五つの軸だけが種目で変わる。海外リーグが主戦場。",
      enter: "板へ",
      hot: "注目",
      boardsTitle: "板",
      matches: "試合",
      rate: "採点",
      liveNow: "進行中",
      apiFixtures: "TheSportsDB",
      apiFixturesHint: "NBA・PL は約90秒ごとに自動更新。",
      liveSyncHint: "ライブは高頻度更新。バックグラウンドでは間隔を長くします。",
      liveEmpty: "実試合データがありません。service key を設定してください。",
      liveBoardLead: "TheSportsDB の最近の試合とメンバー全員が採点対象。",
      players: "選手",
      morePlayers: "人はスレッドへ",
      demoArchive: "デモ",
    },
    board: {
      matches: "試合スレ",
      dimensions: "ポジション別五軸",
      dimensionsHint:
        "ポジションごとに五つの軸。総合はその役割の重み付け合計（単純平均ではない）。",
      empty: "該当する試合はありません。",
      backHome: "すべての板",
      allLeagues: "全リーグ",
    },
    esports: {
      empty:
        "このゲームの試合は現在ありません。しばらくして更新するか別タブを試してください。",
      emptyGame: "このカテゴリに試合はありません — 1 分ほどしてから再度お試しください。",
      dataHint: "PandaScore の日程 · 約45秒キャッシュ · ライブは高頻度更新。",
      dataHintKashrock:
        "KashRock の日程 · ゲーム別 · Sandbox 20 req/分 · 約30秒キャッシュ。",
    },
    event: {
      ratePlayer: "採点する",
      community: "平均",
      ratings: "件",
      yourScore: "あなたの点",
      homeSpotlight: "ホーム代表",
      awaySpotlight: "アウェイ代表",
      hotTake: "注目コメント",
      noHotTake: "まだ注目コメントがありません。",
      spotlightEmpty: "代表選手がまだいません。",
      spotlightHint: "この試合の代表 · 採点対象 {n} 人",
      squadRatings: "全員採点",
      squadRatingsLead: "ホームとアウェイに分けてコミュニティ平均を表示。",
      squadRatingsLeadCompact: "選手をタップで詳細採点と全コメント。下でチーム切替。",
      squadPlayers: "人",
      squadEmpty: "この側のメンバーはまだありません。",
      viewPlayer: "カードを見る",
    },
    rate: {
      title: "選手カード",
      back: "試合スレ",
      community: "平均",
      yourTake: "五つの点",
      comment: "一言",
      commentHint: "具体的なプレーを。勝敗コールは不要。",
      post: "投稿",
      posted: "この端末に保存しました。",
      needComment: "8文字以上。空欄でも採点だけ送れます。",
      nickname: "ハンドル",
      saveName: "保存",
      noComments: "まだ一言がありません。",
      takes: "一言",
      you: "自分",
      communityBoard: "コミュニティ採点",
      filterAll: "すべて",
      filterMine: "自分",
      filterOthers: "他人",
      radarLegend: "橙 = 平均 · 青 = あなた",
      allRatings: "すべての採点",
      noCommunityYet: "クラウド採点はまだありません。",
      noCommentsInFilter: "このフィルターにコメントはありません。",
      overallWeighted: "総合点はポジション加重（下の採点ガイド参照）。",
      ratingGuide: "採点ガイド",
      ratingGuideLead: "「{role}」の五軸を重み付けして総合点にします：",
      yourScores: "あなたの五軸",
      overallOnly: "総合のみ",
      overallOnlyHint:
        "無料会員は UTC 日あたり {limit} 回まで五軸詳細。総合のみは無制限。",
      fullQuotaBanner:
        "本日の五軸枠を使い切りました（{used}/{limit}）。総合のみかプロフィールで VIP。",
      fullLimitError: "五軸の日次上限です。総合のみか VIP をご利用ください。",
      vipWeightHint: "VIP 会員の採点は平均で 2 倍の重みになります。",
      scoreOnly: "採点のみ（コメントなし）。",
      postComment: "採点・コメントを投稿",
      backToPlayer: "選手カードに戻る",
      detailScores: "コミュニティ内訳",
    },
    feed: {
      title: "フィード",
      lead: "全板の採点と一言。新しい順。",
      take: "カード",
      comment: "一言",
      rating: "採点",
      empty: "まだありません。選手を採点してください。",
    },
    guide: {
      title: "作り方",
      lead: "種目ごとの板、一枚の採点カード、種目で変わる五つの軸。海外向けで、多言語が前提。",
      sections: [
        {
          title: "板が先",
          body: [
            "ホームから NBA / サッカー / NFL / F1 / テニス / UFC に入る。",
            "採点画面のレイアウトは全板で同じ。",
          ],
        },
        {
          title: "軸は変える、UIは変えない",
          body: [
            "スライダーは五つだけ。ラベルだけ差し替える。総合は平均。",
            "NBA と UFC を同じ「技術」で採点すると意味がなくなる。",
          ],
        },
        {
          title: "海外リーグ、言語は後追いしない",
          body: [
            "デフォルト英語。同じ板を中国語・スペイン語・日本語でも出す。",
            "選手名は国際表記のまま。",
          ],
        },
      ],
    },
    footer: "Sideline · 試作。採点はこのブラウザに保存されます。",
    notFound: {
      title: "スレがありません",
      body: "この試合または選手は板にありません。",
      back: "板に戻る",
    },
    dims: {
      nba: {
        scoring: "得点",
        defense: "守備",
        playmaking: "組み立て",
        hustle: "ハッスル",
        clutch: "クラッチ",
      },
      soccer: {
        attack: "攻撃",
        creation: "創造",
        defending: "守備",
        workrate: "運動量",
        composure: "冷静さ",
      },
      esports: {
        mechanics: "操作",
        macro: "マクロ",
        impact: "インパクト",
        consistency: "安定",
        clutch: "クラッチ",
      },
      nfl: {
        execution: "遂行",
        physicality: "フィジカル",
        awareness: "判断",
        consistency: "安定",
        clutch: "クラッチ",
      },
      f1: {
        pace: "ペース",
        racecraft: "バトル",
        tyres: "タイヤ",
        consistency: "安定",
        composure: "冷静さ",
      },
      tennis: {
        serve: "サーブ",
        return: "リターン",
        rally: "ラリー",
        movement: "ムーブ",
        clutch: "クラッチ",
      },
      ufc: {
        striking: "打撃",
        grappling: "グラップリング",
        cardio: "心肺",
        control: "コントロール",
        composure: "冷静さ",
      },
    },
  },
};

export const localeLabels: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  es: "Español",
  ja: "日本語",
};
