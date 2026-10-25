import { createSign, X509Certificate } from "crypto";
import { readFileSync } from "fs";
import { compactVerify, decodeProtectedHeader, importX509 } from "jose";
import path from "path";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import {
  VIP_APPLE_PRODUCT_ID,
  VIP_GOOGLE_PRODUCT_ID,
  VIP_PRICE_EUR,
  VIP_PRODUCT_NAME,
  VIP_PRODUCT_NAME_EN,
} from "@/lib/vip";

const APPLE_BUNDLE_ID = "com.grandstand.tribune";
const GOOGLE_PACKAGE = "com.grandstand.tribune";

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export async function grantVipUntil(userId: string, untilIso: string) {
  const admin = createServiceClient();
  if (!admin) return "Missing SUPABASE_SERVICE_ROLE_KEY";
  const { error } = await admin.from("profiles").upsert(
    { id: userId, vip_until: untilIso, updated_at: new Date().toISOString() },
    { onConflict: "id" },
  );
  if (error && /vip_until/.test(error.message)) return "vip_until_missing";
  return error?.message ?? null;
}

export async function createMonthlyCheckout(input: {
  userId: string;
  email: string;
  origin: string;
}) {
  const stripe = stripeClient();
  if (!stripe) return { error: "stripe_not_configured" as const, url: null };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: input.email || undefined,
    client_reference_id: input.userId,
    metadata: { userId: input.userId },
    subscription_data: { metadata: { userId: input.userId } },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: VIP_PRICE_EUR * 100,
          recurring: { interval: "month" },
          product_data: {
            name: `${VIP_PRODUCT_NAME} / ${VIP_PRODUCT_NAME_EN}`,
            description: "Five-axis ratings without the daily cap, weighted ×2.",
          },
        },
      },
    ],
    success_url: `${input.origin}/profile/vip?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/profile/vip?canceled=1`,
  });
  if (!session.url) return { error: "checkout_failed" as const, url: null };
  return { error: null, url: session.url };
}

function subscriptionPeriodEnd(sub: Stripe.Subscription) {
  const end = sub.items?.data?.[0]?.current_period_end;
  if (!end) return null;
  return new Date(end * 1000).toISOString();
}

export async function vipUntilFromCheckoutSession(sessionId: string, userId: string) {
  const stripe = stripeClient();
  if (!stripe) return { error: "stripe_not_configured" as const, until: null };
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });
  if (session.metadata?.userId !== userId && session.client_reference_id !== userId) {
    return { error: "wrong_account" as const, until: null };
  }
  if (session.status !== "complete") return { error: "unpaid" as const, until: null };
  const sub = session.subscription;
  if (!sub || typeof sub === "string") return { error: "missing_subscription" as const, until: null };
  const until = subscriptionPeriodEnd(sub);
  if (!until) return { error: "missing_period" as const, until: null };
  return { error: null, until };
}

export async function handleStripeEvent(rawBody: string, signature: string) {
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) return { status: 503, error: "stripe_not_configured" };
  const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId || session.client_reference_id;
    if (!userId || !session.id) return { status: 200, error: null };
    const paid = await vipUntilFromCheckoutSession(session.id, userId);
    if (paid.until) await grantVipUntil(userId, paid.until);
    return { status: 200, error: null };
  }
  if (event.type === "invoice.paid") {
    const subRef = event.data.object.parent?.subscription_details?.subscription;
    const subId = typeof subRef === "string" ? subRef : subRef?.id;
    if (!subId) return { status: 200, error: null };
    const sub = await stripe.subscriptions.retrieve(subId);
    const userId = sub.metadata?.userId;
    const until = subscriptionPeriodEnd(sub);
    if (userId && until) await grantVipUntil(userId, until);
    return { status: 200, error: null };
  }
  if (event.type === "customer.subscription.deleted") {
    const userId = event.data.object.metadata?.userId;
    if (userId) await grantVipUntil(userId, new Date().toISOString());
  }
  return { status: 200, error: null };
}

function pemFromDerBase64(b64: string) {
  const body = b64.match(/.{1,64}/g)?.join("\n") ?? b64;
  return `-----BEGIN CERTIFICATE-----\n${body}\n-----END CERTIFICATE-----`;
}

let appleRoot: X509Certificate | null = null;
function appleRootCert() {
  if (!appleRoot) {
    const pem = readFileSync(path.join(process.cwd(), "src/lib/apple-root-g3.pem"), "utf8");
    appleRoot = new X509Certificate(pem);
  }
  return appleRoot;
}

export async function appleVipUntil(jws: string) {
  const header = decodeProtectedHeader(jws);
  const chain = header.x5c;
  if (!chain?.length) throw new Error("missing_certificate");
  const certs = chain.map((der) => new X509Certificate(pemFromDerBase64(der)));
  for (let i = 0; i < certs.length - 1; i++) {
    if (!certs[i]!.verify(certs[i + 1]!.publicKey)) throw new Error("bad_certificate_chain");
  }
  const root = appleRootCert();
  const last = certs[certs.length - 1]!;
  const anchored = last.fingerprint256 === root.fingerprint256 || last.verify(root.publicKey);
  if (!anchored) throw new Error("untrusted_certificate");
  const key = await importX509(certs[0]!.toString(), header.alg ?? "ES256");
  const { payload } = await compactVerify(jws, key);
  const body = JSON.parse(new TextDecoder().decode(payload)) as {
    bundleId?: string;
    productId?: string;
    expiresDate?: number;
    revocationDate?: number;
    appAccountToken?: string;
  };
  if (body.bundleId !== APPLE_BUNDLE_ID || body.productId !== VIP_APPLE_PRODUCT_ID) {
    throw new Error("wrong_product");
  }
  if (body.revocationDate) throw new Error("revoked");
  if (!body.expiresDate || body.expiresDate <= Date.now()) throw new Error("expired");
  return { until: new Date(body.expiresDate).toISOString(), appAccountToken: body.appAccountToken ?? "" };
}

type GoogleServiceAccount = { client_email: string; private_key: string };

function googleAccount(): GoogleServiceAccount | null {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  const parsed = JSON.parse(raw) as GoogleServiceAccount;
  if (!parsed.client_email || !parsed.private_key) return null;
  return parsed;
}

async function googleAccessToken(account: GoogleServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(
    JSON.stringify({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/androidpublisher",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");
  const unsigned = `${header}.${claim}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(account.private_key, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) throw new Error(data.error || "google_auth_failed");
  return data.access_token;
}

export async function googleVipUntil(purchaseToken: string) {
  const account = googleAccount();
  if (!account) return { error: "google_not_configured" as const, until: null };
  const access = await googleAccessToken(account);
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${GOOGLE_PACKAGE}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${access}` } });
  const data = (await res.json()) as {
    error?: { message?: string };
    lineItems?: { productId?: string; expiryTime?: string }[];
  };
  if (!res.ok) throw new Error(data.error?.message || "google_verify_failed");
  const item = (data.lineItems ?? []).find((row) => row.productId === VIP_GOOGLE_PRODUCT_ID);
  if (!item?.expiryTime) throw new Error("wrong_product");
  if (new Date(item.expiryTime).getTime() <= Date.now()) throw new Error("expired");
  return { error: null, until: new Date(item.expiryTime).toISOString() };
}
