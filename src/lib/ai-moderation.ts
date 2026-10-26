import {
  moderateUserContent,
  type ModerationCode,
  type ModerationVerdict,
} from "@/lib/content-moderation";

const MODEL = "omni-moderation-latest";
const ENDPOINT = "https://api.openai.com/v1/moderations";
const TIMEOUT_MS = 8_000;

const VIOLENCE = new Set([
  "sexual",
  "sexual/minors",
  "violence",
  "violence/graphic",
  "self-harm",
  "self-harm/intent",
  "self-harm/instructions",
  "illicit/violent",
]);

const ABUSE = new Set([
  "harassment",
  "harassment/threatening",
  "hate",
  "hate/threatening",
  "illicit",
]);

type ModerationResponse = {
  results?: Array<{
    flagged?: boolean;
    categories?: Record<string, boolean>;
  }>;
};

/** Map a flagged OpenAI moderation result onto the codes the UI already speaks. */
export function codesFromModerationCategories(
  categories: Record<string, boolean> | undefined,
): ModerationCode[] {
  const codes = new Set<ModerationCode>();
  for (const [name, hit] of Object.entries(categories ?? {})) {
    if (!hit) continue;
    if (VIOLENCE.has(name)) codes.add("porn_violence");
    else if (ABUSE.has(name)) codes.add("profanity");
  }
  if (codes.size === 0) codes.add("profanity");
  return [...codes];
}

/**
 * Ask OpenAI moderation. Returns null when the key is missing or the service
 * does not answer, so the caller can keep the local verdict.
 */
export async function moderateWithAi(body: string): Promise<ModerationVerdict | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const trimmed = body.trim();
  if (!trimmed || trimmed === "—") {
    return { pass: true, status: "approved" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        input: trimmed.slice(0, 4000),
      }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ModerationResponse;
    const result = data.results?.[0];
    if (!result || typeof result.flagged !== "boolean") return null;
    if (!result.flagged) return { pass: true, status: "approved" };
    return {
      pass: false,
      status: "rejected",
      codes: codesFromModerationCategories(result.categories),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Local rules first, then the moderation model. A model outage keeps the local result. */
export async function moderateComment(body: string): Promise<ModerationVerdict> {
  const local = moderateUserContent(body);
  if (!local.pass) return local;
  const ai = await moderateWithAi(body);
  return ai ?? local;
}
