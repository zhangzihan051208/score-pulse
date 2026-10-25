import { API_URL } from "./cloud";

/** Browser preview cannot open StoreKit or Play Billing. It uses the website checkout. */
export const billingKind: "web" | "store" = "web";

export async function buyMonthly(token: string | null): Promise<string | null> {
  if (!token) return "sign_in";
  const res = await fetch(`${API_URL}/api/vip/checkout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!res.ok || !data?.url) return data?.error ?? "buy_failed";
  if (typeof window !== "undefined") window.location.href = data.url;
  return "redirect";
}

export async function restoreMonthly(token: string | null): Promise<string | null> {
  if (!token) return "sign_in";
  return "none";
}
