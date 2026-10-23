export const ONBOARDING_DONE_STORAGE_KEY = "sideline-onboarding-done-v1";

export function readOnboardingDoneLocal(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(ONBOARDING_DONE_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.includes(userId);
    }
    return raw === userId;
  } catch {
    return false;
  }
}

export function writeOnboardingDoneLocal(userId: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ONBOARDING_DONE_STORAGE_KEY);
    let ids: string[] = [];
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) ids = parsed.filter((x) => typeof x === "string");
      else if (typeof parsed === "string") ids = [parsed];
    }
    if (!ids.includes(userId)) ids.push(userId);
    localStorage.setItem(ONBOARDING_DONE_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    localStorage.setItem(ONBOARDING_DONE_STORAGE_KEY, JSON.stringify([userId]));
  }
}
