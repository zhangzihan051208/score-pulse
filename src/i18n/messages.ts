import { deOverrides } from "@/i18n/de-overrides";
import { deepMerge } from "@/lib/deep-merge";
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
    rankings: string;
    zones: string;
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
    squadRankings: string;
  };
  player: {
    hubKicker: string;
    noTeam: string;
    careerAvg: string;
    careerAxes: string;
    teamRankLink: string;
    globalRankLink: string;
    eventRankTitle: string;
    eventRankHint: string;
    noRatingsYet: string;
    matchFallback: string;
    profileLink: string;
  };
  zones: {
    title: string;
    lead: string;
    create: string;
    createTitle: string;
    createLead: string;
    publish: string;
    allCategories: string;
    categories: Record<
      "food" | "drink" | "snack" | "restaurant" | "product" | "custom",
      string
    >;
    empty: string;
    heat: string;
    items: string;
    notFound: string;
    manage: string;
    hotItems: string;
    noItems: string;
    addItem: string;
    addItemBtn: string;
    itemNamePh: string;
    itemPhotoPh: string;
    signInToAdd: string;
    signInToRate: string;
    rateItem: string;
    commentPending: string;
    pending: string;
    fieldTitle: string;
    fieldTitlePh: string;
    fieldCategory: string;
    fieldDims: string;
    fieldDimsHint: string;
    fieldCover: string;
    fieldDesc: string;
    moderationTitle: string;
    moderationLead: string;
    moderationEmpty: string;
    approve: string;
    reject: string;
    viewItem: string;
    homeStrip: string;
    homeStripCta: string;
  };
  rankings: {
    title: string;
    lead: string;
    scopeGlobal: string;
    scopeTeam: string;
    teamSearchPlaceholder: string;
    applyTeam: string;
    boardOverall: string;
    boardDimension: string;
    empty: string;
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
    ratingsTitle: string;
    ratingsHint: string;
    ratingsEmpty: string;
    ratingModeFull: string;
    ratingModeOverall: string;
    ratingOpenMatch: string;
    myZonesTitle: string;
    myZonesHint: string;
    myZonesEmpty: string;
    myZonesCreate: string;
    myZonesHeatTotal: string;
    myZonesCount: string;
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
  moderation: {
    autoBadge: string;
    autoLead: string;
    blockAd: string;
    blockProfanity: string;
    blockPornViolence: string;
    blockSpam: string;
    blockGeneric: string;
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

const en: Dict = {
  brand: "Grandstand",
  tagline: "Rate the game, not the highlight reel",
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
      rankings: "Rankings",
      zones: "Zones",
      search: "Search",
    },
    zones: {
      title: "Rating zones",
      lead: "Create or browse DIY boards — food, products, and more. Each zone has custom axes; items rank by heat.",
      create: "Create zone",
      createTitle: "Launch a rating zone",
      createLead: "Pick a category, name up to five scoring axes, and start listing items with photos.",
      publish: "Publish zone",
      allCategories: "All",
      categories: {
        food: "Food",
        drink: "Drinks",
        snack: "Snacks",
        restaurant: "Restaurants",
        product: "Products",
        custom: "Custom",
      },
      empty: "No zones yet. Be the first to create a food or product board.",
      heat: "Heat",
      items: "items",
      notFound: "Zone not found.",
      manage: "Moderation queue",
      hotItems: "Hot rankings",
      noItems: "No items yet — add the first entry below.",
      addItem: "List something to rate",
      addItemBtn: "Add item",
      itemNamePh: "Name (e.g. spicy chicken sandwich)",
      itemPhotoPh: "Photo URL (optional)",
      signInToAdd: "Sign in to add items.",
      signInToRate: "Sign in to rate and comment.",
      rateItem: "Your scores",
      commentPending: "Comment submitted — waiting for zone owner approval.",
      pending: "Pending review",
      fieldTitle: "Zone title",
      fieldTitlePh: "e.g. Office snack rankings",
      fieldCategory: "Category",
      fieldDims: "Scoring axes (one per line, 3–5)",
      fieldDimsHint: "Default food preset shown. Edit labels freely.",
      fieldCover: "Cover image URL",
      fieldDesc: "Short description",
      moderationTitle: "Comment safety",
      moderationLead: "Automatic filters run on every comment in this zone.",
      moderationEmpty: "No comments waiting for review.",
      approve: "Approve",
      reject: "Reject",
      viewItem: "View item",
      homeStrip: "DIY rating zones",
      homeStripCta: "Browse hot boards →",
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
      squadRankings: "Squad rating board",
    },
    player: {
      hubKicker: "Player hub",
      noTeam: "Team not linked yet",
      careerAvg: "Community average",
      careerAxes: "Career axis average (VIP-weighted)",
      teamRankLink: "Squad rankings",
      globalRankLink: "Sport leaderboard",
      eventRankTitle: "Per-match ratings",
      eventRankHint: "Each row is community average for one fixture, sorted high to low.",
      noRatingsYet: "No community ratings yet — rate this player from a match thread.",
      matchFallback: "Match",
      profileLink: "Player hub",
    },
    rankings: {
      title: "Rating boards",
      lead: "Community scores with VIP weighting. Switch sport, squad, overall vs single axis.",
      scopeGlobal: "All players",
      scopeTeam: "By squad",
      teamSearchPlaceholder: "Club name…",
      applyTeam: "Apply",
      boardOverall: "Overall",
      boardDimension: "By axis",
      empty: "No ratings in this board yet. Post scores from match threads to populate ranks.",
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
      vipEntry: "Grandstand VIP",
      vipEntryHint: "Unlimited five-axis ratings · 2× weight in averages",
      ratingsTitle: "Your rating history",
      ratingsHint:
        "Cloud scores you posted while signed in (newest first). Demo seed comments are not listed here.",
      ratingsEmpty: "No cloud ratings yet. Rate a player from a match thread while signed in.",
      ratingModeFull: "Five-axis",
      ratingModeOverall: "Overall only",
      ratingOpenMatch: "Open match",
      myZonesTitle: "My DIY zones",
      myZonesHint: "Zones you created, ranked by heat earned from ratings and approved comments.",
      myZonesEmpty: "You have not created a zone yet. Launch a food or product board in one minute.",
      myZonesCreate: "New zone",
      myZonesHeatTotal: "Total heat",
      myZonesCount: "Zones",
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
    moderation: {
      autoBadge: "Auto moderation",
      autoLead:
        "Comments are scanned for ads, banned words, and violent or sexual content before they go live.",
      blockAd: "Blocked: promotional or link spam is not allowed.",
      blockProfanity: "Blocked: abusive language is not allowed.",
      blockPornViolence: "Blocked: sexual or violent content is not allowed.",
      blockSpam: "Blocked: repetitive or low-quality spam.",
      blockGeneric: "Blocked by automatic moderation. Edit your take and try again.",
    },
    vip: {
      title: "Grandstand VIP",
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
      signInToPost: "Sign in to post your rating to Grandstand cloud.",
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
      title: "From the stands — rate the night.",
      lead: "Grandstand is your fan tribune: five axes per match plus what you actually saw. Overseas leagues first.",
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
      radarLegend:
        "Spikes vs dimension average (dashed ring = avg). Orange = community · Blue = you",
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
    footer: "Grandstand · Fan ratings for leagues worldwide. Cloud with sign-in · local without account.",
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
};

export const messages: Record<Locale, Dict> = {
  en,
  zh: {
    brand: "看台",
    tagline: "评这一夜，不看名气",
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
      rankings: "评分榜",
      zones: "评分专区",
      search: "搜索",
    },
    zones: {
      title: "评分专区",
      lead: "自建或浏览 DIY 榜单：美食、好物等。每个专区自定义评分项，条目按热度排序推送。",
      create: "创建专区",
      createTitle: "上架你的评分区",
      createLead: "选分类、自定义最多五个评分维度，上传可评分的条目与配图链接。",
      publish: "发布专区",
      allCategories: "全部",
      categories: {
        food: "美食",
        drink: "饮品",
        snack: "零食",
        restaurant: "餐厅",
        product: "好物",
        custom: "自定义",
      },
      empty: "还没有专区，来创建第一个美食/好物榜吧。",
      heat: "热度",
      items: "条目",
      notFound: "专区不存在",
      manage: "评论审核",
      hotItems: "热度排行",
      noItems: "还没有条目，在下方添加第一个。",
      addItem: "上架可评分条目",
      addItemBtn: "添加",
      itemNamePh: "名称（如：某某奶茶）",
      itemPhotoPh: "配图 URL（可选）",
      signInToAdd: "登录后可添加条目。",
      signInToRate: "登录后可评分、评论。",
      rateItem: "你的评分",
      commentPending: "评论已提交，等待专区主审核。",
      pending: "待审核",
      fieldTitle: "专区名称",
      fieldTitlePh: "如：公司零食榜",
      fieldCategory: "分类",
      fieldDims: "评分项（每行一个，3–5 项）",
      fieldDimsHint: "默认是美食品项，可随意改。",
      fieldCover: "封面图 URL",
      fieldDesc: "简介",
      moderationTitle: "评论安全",
      moderationLead: "本专区评论均经系统自动审核（违禁词 / 广告 / 色情暴力）。",
      moderationEmpty: "暂无待审核评论。",
      approve: "通过",
      reject: "拒绝",
      viewItem: "查看条目",
      homeStrip: "自定义评分专区",
      homeStripCta: "去看热门专区 →",
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
      squadRankings: "全队评分榜",
    },
    player: {
      hubKicker: "选手主页",
      noTeam: "暂未关联战队",
      careerAvg: "社区综合均分",
      careerAxes: "五维生涯均值（含 VIP 权重）",
      teamRankLink: "本队评分榜",
      globalRankLink: "分项总榜",
      eventRankTitle: "单场评分排行",
      eventRankHint: "每一行是一场比赛的社区均分，从高到低排序。",
      noRatingsYet: "还没有社区评分，请从比赛帖为 TA 打分。",
      matchFallback: "比赛",
      profileLink: "选手主页",
    },
    rankings: {
      title: "评分排行专区",
      lead: "社区评分（VIP 权重更高）。可切换运动、战队、总榜与单维榜。",
      scopeGlobal: "全站选手",
      scopeTeam: "按战队",
      teamSearchPlaceholder: "输入俱乐部名称…",
      applyTeam: "确定",
      boardOverall: "总榜",
      boardDimension: "分类榜",
      empty: "该榜单暂无评分，请先在比赛帖提交评分。",
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
      vipEntry: "看台 VIP",
      vipEntryHint: "五维详评不限次 · 均分权重 ×2",
      ratingsTitle: "我的评分记录",
      ratingsHint:
        "登录后在云端提交的评分（按时间倒序）。演示用的内置假评论不会出现在这里。",
      ratingsEmpty: "还没有云端评分，请登录后在比赛帖里给球员打分。",
      ratingModeFull: "五维详评",
      ratingModeOverall: "仅总分",
      ratingOpenMatch: "打开比赛",
      myZonesTitle: "我的 DIY 专区",
      myZonesHint: "你创建的评分专区及累计热度（来自评分与通过审核的评论）。",
      myZonesEmpty: "还没有专区，去创建一个美食或好物榜吧。",
      myZonesCreate: "新建专区",
      myZonesHeatTotal: "总热度",
      myZonesCount: "专区数",
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
    moderation: {
      autoBadge: "系统自动审核",
      autoLead:
        "评论发布前会自动检测广告引流、违禁词以及色情暴力内容，命中规则将直接拦截。",
      blockAd: "已拦截：不允许广告、外链或引流信息。",
      blockProfanity: "已拦截：包含辱骂或不文明用语。",
      blockPornViolence: "已拦截：包含色情或暴力内容。",
      blockSpam: "已拦截：重复或无意义刷屏。",
      blockGeneric: "未通过自动审核，请修改后重试。",
    },
    vip: {
      title: "看台 VIP",
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
      title: "看台视角，评这一夜",
      lead: "看台（Grandstand）是球迷视角的评分社区：每场比赛五维打分，加上你真实看到的。默认面向海外联赛。",
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
      radarLegend:
        "相对五维均分放大（虚线环 = 均分基准）。橙 = 社区 · 蓝 = 你的评分",
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
    footer: "看台 Grandstand · 全球联赛球迷评分。登录走云端 · 不登录可本地体验。",
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
    brand: "Grandstand",
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
      rankings: "Rankings",
      zones: "Zonas",
      search: "Buscar",
    },
    zones: {
      title: "Zonas de notas",
      lead: "Tablones DIY — comida, productos y más. Ejes personalizados; ranking por heat.",
      create: "Crear zona",
      createTitle: "Abrir una zona",
      createLead: "Elige categoría, hasta cinco ejes, lista items con foto URL.",
      publish: "Publicar",
      allCategories: "Todas",
      categories: {
        food: "Comida",
        drink: "Bebidas",
        snack: "Snacks",
        restaurant: "Restaurantes",
        product: "Productos",
        custom: "Custom",
      },
      empty: "Sin zonas aún.",
      heat: "Heat",
      items: "items",
      notFound: "Zona no encontrada.",
      manage: "Moderación",
      hotItems: "Ranking hot",
      noItems: "Sin items aún.",
      addItem: "Añadir item",
      addItemBtn: "Añadir",
      itemNamePh: "Nombre",
      itemPhotoPh: "URL foto",
      signInToAdd: "Inicia sesión para añadir.",
      signInToRate: "Inicia sesión para votar.",
      rateItem: "Tus notas",
      commentPending: "Comentario en revisión.",
      pending: "Pendiente",
      fieldTitle: "Título",
      fieldTitlePh: "ej. Snacks oficina",
      fieldCategory: "Categoría",
      fieldDims: "Ejes (uno por línea)",
      fieldDimsHint: "Preset comida editable.",
      fieldCover: "URL portada",
      fieldDesc: "Descripción",
      moderationTitle: "Revisión",
      moderationLead: "Aprueba o rechaza comentarios.",
      moderationEmpty: "Nada pendiente.",
      approve: "Aprobar",
      reject: "Rechazar",
      viewItem: "Ver item",
      homeStrip: "Zonas DIY",
      homeStripCta: "Ver hot →",
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
      squadRankings: "Ranking del plantel",
    },
    player: {
      hubKicker: "Ficha del jugador",
      noTeam: "Equipo no vinculado",
      careerAvg: "Media comunitaria",
      careerAxes: "Media por eje (con peso VIP)",
      teamRankLink: "Ranking del equipo",
      globalRankLink: "Clasificación del deporte",
      eventRankTitle: "Notas por partido",
      eventRankHint: "Cada fila es la media comunitaria de un partido, de mayor a menor.",
      noRatingsYet: "Sin notas aún — puntúa desde el hilo del partido.",
      matchFallback: "Partido",
      profileLink: "Ficha",
    },
    rankings: {
      title: "Tablones de notas",
      lead: "Puntuaciones comunitarias con peso VIP. Cambia deporte, plantel, global o eje.",
      scopeGlobal: "Todos",
      scopeTeam: "Por plantel",
      teamSearchPlaceholder: "Nombre del club…",
      applyTeam: "Aplicar",
      boardOverall: "Global",
      boardDimension: "Por eje",
      empty: "Sin datos en este tablón. Publica notas en los partidos.",
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
      vipEntry: "Grandstand VIP",
      vipEntryHint: "Notas de cinco ejes ilimitadas · peso ×2",
      ratingsTitle: "Historial de notas",
      ratingsHint:
        "Tus notas en la nube con sesión iniciada (más recientes primero). Los comentarios demo no aparecen.",
      ratingsEmpty: "Sin notas en la nube. Puntúa en un hilo de partido con sesión iniciada.",
      ratingModeFull: "Cinco ejes",
      ratingModeOverall: "Solo total",
      ratingOpenMatch: "Ver partido",
      myZonesTitle: "Mis zonas DIY",
      myZonesHint:
        "Zonas que creaste, ordenadas por heat acumulado (notas y comentarios aprobados).",
      myZonesEmpty: "Aún no tienes zonas. Crea un ranking de comida o productos en un minuto.",
      myZonesCreate: "Nueva zona",
      myZonesHeatTotal: "Heat total",
      myZonesCount: "Zonas",
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
    moderation: {
      autoBadge: "Moderación automática",
      autoLead: "Detectamos anuncios, palabras prohibidas y contenido sexual o violento.",
      blockAd: "Bloqueado: publicidad o enlaces.",
      blockProfanity: "Bloqueado: lenguaje abusivo.",
      blockPornViolence: "Bloqueado: contenido sexual o violento.",
      blockSpam: "Bloqueado: spam.",
      blockGeneric: "Bloqueado por moderación automática.",
    },
    vip: {
      title: "Grandstand VIP",
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
      lead: "Grandstand es tu grada: cinco ejes por partido y lo que viste de verdad. Ligas internacionales primero.",
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
      radarLegend:
        "Picos vs media por eje (anillo = media). Naranja = comunidad · Azul = tú",
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
    footer: "Grandstand · Notas de afición. Nube con sesión · local sin cuenta.",
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
    brand: "Grandstand",
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
      rankings: "ランキング",
      zones: "専区",
      search: "検索",
    },
    zones: {
      title: "採点ゾーン",
      lead: "食べ物・商品など DIY 板。軸は自由、Heat 順に表示。",
      create: "ゾーン作成",
      createTitle: "採点ゾーンを開設",
      createLead: "カテゴリと最大5軸、画像URL付きエントリを追加。",
      publish: "公開",
      allCategories: "すべて",
      categories: {
        food: "フード",
        drink: "ドリンク",
        snack: "スナック",
        restaurant: "レストラン",
        product: "商品",
        custom: "カスタム",
      },
      empty: "まだゾーンがありません。",
      heat: "Heat",
      items: "件",
      notFound: "ゾーンが見つかりません。",
      manage: "モデレーション",
      hotItems: "人気ランキング",
      noItems: "エントリなし",
      addItem: "エントリ追加",
      addItemBtn: "追加",
      itemNamePh: "名前",
      itemPhotoPh: "画像 URL",
      signInToAdd: "追加にはログイン",
      signInToRate: "採点にはログイン",
      rateItem: "あなたの採点",
      commentPending: "コメントは承認待ちです。",
      pending: "審査中",
      fieldTitle: "ゾーン名",
      fieldTitlePh: "例：オフィスおやつ",
      fieldCategory: "カテゴリ",
      fieldDims: "採点軸（1行1つ）",
      fieldDimsHint: "フード初期値を編集可。",
      fieldCover: "カバー URL",
      fieldDesc: "説明",
      moderationTitle: "コメント審査",
      moderationLead: "承認・拒否。承認で Heat 加算。",
      moderationEmpty: "保留コメントなし",
      approve: "承認",
      reject: "拒否",
      viewItem: "エントリ",
      homeStrip: "DIY 採点ゾーン",
      homeStripCta: "人気ゾーン →",
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
      squadRankings: "チーム内ランキング",
    },
    player: {
      hubKicker: "選手ページ",
      noTeam: "チーム未連携",
      careerAvg: "コミュニティ平均",
      careerAxes: "五軸キャリア平均（VIP 加重）",
      teamRankLink: "チーム内榜",
      globalRankLink: "種目総合榜",
      eventRankTitle: "試合別スコア",
      eventRankHint: "各行は1試合のコミュニティ平均。高い順。",
      noRatingsYet: "まだ採点がありません。試合スレッドから採点してください。",
      matchFallback: "試合",
      profileLink: "選手ページ",
    },
    rankings: {
      title: "採点ランキング",
      lead: "VIP 加重のコミュニティスコア。種目・チーム・総合／単軸を切替。",
      scopeGlobal: "全選手",
      scopeTeam: "チーム別",
      teamSearchPlaceholder: "クラブ名…",
      applyTeam: "適用",
      boardOverall: "総合",
      boardDimension: "単軸",
      empty: "この榜にはまだデータがありません。試合から採点を投稿してください。",
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
      vipEntry: "Grandstand VIP",
      vipEntryHint: "五軸無制限 · 平均で 2 倍の重み",
      ratingsTitle: "採点履歴",
      ratingsHint:
        "ログイン中にクラウドへ投稿した採点（新しい順）。デモ用の固定コメントは含みません。",
      ratingsEmpty: "クラウド採点はまだありません。試合スレッドからログインして採点してください。",
      ratingModeFull: "五軸",
      ratingModeOverall: "総合のみ",
      ratingOpenMatch: "試合を開く",
      myZonesTitle: "マイ DIY ゾーン",
      myZonesHint: "作成した評価ゾーンと累計ヒート（採点と承認済みコメントから）。",
      myZonesEmpty: "まだゾーンがありません。グルメや好物ランキングを作ってみましょう。",
      myZonesCreate: "ゾーンを作成",
      myZonesHeatTotal: "合計ヒート",
      myZonesCount: "ゾーン数",
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
    moderation: {
      autoBadge: "自動モデレーション",
      autoLead: "広告・禁止語・性的/暴力的表現を自動検出します。",
      blockAd: "ブロック：広告やリンク。",
      blockProfanity: "ブロック：暴言。",
      blockPornViolence: "ブロック：性的・暴力的内容。",
      blockSpam: "ブロック：スパム。",
      blockGeneric: "自動モデレーションによりブロックされました。",
    },
    vip: {
      title: "Grandstand VIP",
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
      lead: "Grandstand はファンのスタンド視点。試合ごとに五軸採点と本当に見たプレイ。海外リーグ中心。",
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
      radarLegend:
        "五軸平均からの偏差を強調（破線 = 平均）。橙 = コミュニティ · 青 = あなた",
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
    footer: "Grandstand · ファン採点コミュニティ。ログインでクラウド · 未ログインはローカル。",
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
  de: deepMerge(en, deOverrides as unknown as Partial<Dict>),
};

export const localeLabels: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  es: "Español",
  ja: "日本語",
  de: "Deutsch",
};
