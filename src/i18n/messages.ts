import type { Locale, Sport } from "@/lib/types";

type Dict = {
  brand: string;
  tagline: string;
  nav: {
    home: string;
    boards: string;
    feed: string;
    guide: string;
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
  };
  board: {
    matches: string;
    dimensions: string;
    empty: string;
    backHome: string;
  };
  event: {
    ratePlayer: string;
    community: string;
    ratings: string;
    yourScore: string;
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
  };
  feed: {
    title: string;
    lead: string;
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
    nav: { home: "Home", boards: "Boards", feed: "Feed", guide: "Guide" },
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
      nfl: "NFL",
      f1: "F1",
      tennis: "Tennis",
      ufc: "UFC",
    },
    sportBlurb: {
      nba: "Box score is a start. Grade scoring, defense, playmaking, hustle, clutch.",
      soccer: "Grade the 90: attack, chance creation, defending, work rate, composure.",
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
        "NBA & Premier League schedule/scores sync when Supabase service key is set.",
    },
    board: {
      matches: "Match threads",
      dimensions: "This board’s five grades",
      empty: "No matches in this filter.",
      backHome: "All boards",
    },
    event: {
      ratePlayer: "Grade",
      community: "Board average",
      ratings: "ratings",
      yourScore: "Your card",
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
    },
    feed: {
      title: "Feed",
      lead: "Ratings and takes from every board, newest first.",
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
          title: "Five grades, sport-specific",
          body: [
            "Keep exactly five sliders. Only the labels change. Overall is the average — no sixth control.",
            "NBA is not UFC. If the axes are generic, the grades become noise.",
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
    nav: { home: "首页", boards: "分区", feed: "动态", guide: "手册" },
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
      nfl: "NFL",
      f1: "F1",
      tennis: "网球",
      ufc: "UFC",
    },
    sportBlurb: {
      nba: "得分、防守、组织、拼劲、关键球。数据只是起点。",
      soccer: "进攻、做戏、防守、跑动、心态。给满 90 分钟。",
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
      apiFixturesHint: "配置 Supabase 服务端密钥后会同步 NBA 与英超比分。",
    },
    board: {
      matches: "比赛帖",
      dimensions: "本分区五维",
      empty: "没有符合筛选的比赛。",
      backHome: "全部分区",
    },
    event: {
      ratePlayer: "去打分",
      community: "分区均分",
      ratings: "人评",
      yourScore: "你的卡",
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
    },
    feed: {
      title: "动态",
      lead: "全分区的评分和短评，最新在上。",
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
    nav: { home: "Inicio", boards: "Tablones", feed: "Feed", guide: "Guía" },
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
      nfl: "NFL",
      f1: "F1",
      tennis: "Tenis",
      ufc: "UFC",
    },
    sportBlurb: {
      nba: "Anota, defiende, crea, pelea, clutch. El box score es el inicio.",
      soccer: "Ataque, creación, defensa, trabajo, temple. Los 90 minutos.",
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
      apiFixturesHint: "NBA y Premier League se sincronizan con la service key.",
    },
    board: {
      matches: "Hilos",
      dimensions: "Las cinco notas de este tablón",
      empty: "No hay partidos en este filtro.",
      backHome: "Todos",
    },
    event: {
      ratePlayer: "Puntuar",
      community: "Media",
      ratings: "votos",
      yourScore: "Tu carta",
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
    },
    feed: {
      title: "Feed",
      lead: "Notas y comentarios de todos los tablones.",
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
    nav: { home: "ホーム", boards: "板", feed: "フィード", guide: "ガイド" },
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
      nfl: "NFL",
      f1: "F1",
      tennis: "テニス",
      ufc: "UFC",
    },
    sportBlurb: {
      nba: "得点・守備・組み立て・ハッスル・クラッチ。",
      soccer: "攻撃・創造・守備・運動量・冷静さ。",
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
      apiFixturesHint: "service key 設定で NBA・PL の同期が有効になります。",
    },
    board: {
      matches: "試合スレ",
      dimensions: "この板の五つの軸",
      empty: "該当する試合はありません。",
      backHome: "すべての板",
    },
    event: {
      ratePlayer: "採点する",
      community: "平均",
      ratings: "件",
      yourScore: "あなたの点",
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
    },
    feed: {
      title: "フィード",
      lead: "全板の採点と一言。新しい順。",
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
