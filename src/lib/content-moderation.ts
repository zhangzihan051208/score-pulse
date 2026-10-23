export type ModerationCode = "ad" | "porn_violence" | "profanity" | "spam";

export type ModerationVerdict =
  | { pass: true; status: "approved" }
  | { pass: false; status: "rejected"; codes: ModerationCode[] };

/** Collapse obfuscation: spaces, dots, homoglyphs-ish separators. */
function normalizeForScan(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\s\u00a0\u200b\-_.·|*/\\,，。!！?？:：;；@#]+/g, "");
}

const URL_RE =
  /(?:https?:\/\/|www\.)[^\s]+|\b[a-z0-9-]+\.(?:com|cn|net|org|io|xyz|shop|top|vip|app|link|me|tv|cc)\b/i;

const AD_PATTERNS: RegExp[] = [
  URL_RE,
  /加?(?:微信|vx|v信|wechat|telegram|tg|qq群?|q群)/i,
  /(?:代购|刷单|兼职|日赚|免费领取|优惠码|促销|点击链接|扫码关注|引流)/i,
  /(?:buy now|click here|limited offer|promo code|dm me|follow my)/i,
  /(?:whatsapp|line id|加v|➕v|私聊购买)/i,
];

/** Sexual / violent solicitation — heuristic keywords, not exhaustive. */
const PORN_VIOLENCE_PATTERNS: RegExp[] = [
  /(?:色情|裸体|裸聊|约炮|一夜情|成人视频|黄片|av片|无码)/i,
  /(?:porn|xxx|nude|nsfw|onlyfans|escort|hentai)/i,
  /(?:杀人|弄死|血腥|肢解|虐杀|强奸|轮奸)/i,
  /(?:kill him|murder|gore|beheading|rape)/i,
];

const PROFANITY_PATTERNS: RegExp[] = [
  /\b(?:fuck|shit|bitch|asshole|cunt)\b/i,
  /(?:傻逼|操你|草泥马|去死|nmsl|cnm)/i,
];

const SPAM_PATTERNS: RegExp[] = [
  /(.)\1{6,}/,
  /(?:.{1,3}\s){8,}/,
];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  const plain = text;
  const compact = normalizeForScan(text);
  return patterns.some((re) => re.test(plain) || re.test(compact));
}

export function moderateUserContent(body: string): ModerationVerdict {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    return { pass: true, status: "approved" };
  }

  const codes: ModerationCode[] = [];

  if (matchesAny(trimmed, AD_PATTERNS)) codes.push("ad");
  if (matchesAny(trimmed, PORN_VIOLENCE_PATTERNS)) codes.push("porn_violence");
  if (matchesAny(trimmed, PROFANITY_PATTERNS)) codes.push("profanity");
  if (trimmed.length >= 12 && matchesAny(trimmed, SPAM_PATTERNS)) {
    codes.push("spam");
  }

  if (codes.length === 0) {
    return { pass: true, status: "approved" };
  }

  return { pass: false, status: "rejected", codes: [...new Set(codes)] };
}

export function moderationI18nKey(codes: ModerationCode[]): string {
  if (codes.includes("porn_violence")) return "moderation.blockPornViolence";
  if (codes.includes("ad")) return "moderation.blockAd";
  if (codes.includes("profanity")) return "moderation.blockProfanity";
  return "moderation.blockSpam";
}
