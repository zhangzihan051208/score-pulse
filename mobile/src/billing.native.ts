import {
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  isUserCancelledError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type ProductSubscription,
  type Purchase,
} from "expo-iap";
import { Platform } from "react-native";
import { api } from "./cloud";

export const billingKind: "web" | "store" = "store";

const APPLE_SKU = "com.grandstand.tribune.vip.monthly";
const GOOGLE_SKU = "grandstand_vip_monthly";

function sku() {
  return Platform.OS === "android" ? GOOGLE_SKU : APPLE_SKU;
}

async function redeem(token: string, purchase: Purchase): Promise<string | null> {
  const receipt = purchase.purchaseToken?.trim();
  if (!receipt) return "missing_receipt";
  const path = Platform.OS === "android" ? "/api/vip/google" : "/api/vip/apple";
  const body = Platform.OS === "android" ? { purchaseToken: receipt } : { jws: receipt };
  const res = await api(path, token, { method: "POST", body: JSON.stringify(body) });
  if (res.ok) return null;
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? "buy_failed";
}

async function offerToken(productSku: string) {
  const products = (await fetchProducts({ skus: [productSku], type: "subs" })) as ProductSubscription[] | null;
  const product = (products ?? []).find((item) => item.id === productSku);
  if (!product) return { missing: true as const, token: null };
  if (product.platform !== "android") return { missing: false as const, token: null };
  const token = product.subscriptionOffers.find((offer) => offer.offerTokenAndroid)?.offerTokenAndroid ?? null;
  return { missing: !token, token };
}

async function settle(token: string, purchase: Purchase) {
  if (purchase.productId !== sku()) return "wrong_product";
  const error = await redeem(token, purchase);
  if (error) return error;
  try {
    await finishTransaction({ purchase, isConsumable: false });
  } catch {
    // The store already delivered the receipt and the server accepted it.
  }
  return null;
}

export async function buyMonthly(token: string | null): Promise<string | null> {
  if (!token) return "sign_in";
  const productSku = sku();
  await initConnection();
  const offer = await offerToken(productSku);
  if (offer.missing) return "store_unavailable";

  return new Promise((resolve) => {
    let settled = false;
    const finish = (code: string | null) => {
      if (settled) return;
      settled = true;
      updated.remove();
      failed.remove();
      resolve(code);
    };
    const updated = purchaseUpdatedListener((purchase) => {
      void settle(token, purchase)
        .then(finish)
        .catch(() => finish("buy_failed"));
    });
    const failed = purchaseErrorListener((error) => {
      if (isUserCancelledError(error) || error.code === ErrorCode.UserCancelled) finish("canceled");
      else finish("buy_failed");
    });
    void requestPurchase({
      type: "subs",
      request: {
        apple: { sku: productSku },
        google: {
          skus: [productSku],
          subscriptionOffers: offer.token ? [{ sku: productSku, offerToken: offer.token }] : [],
        },
      },
    }).catch((error: unknown) => {
      if (isUserCancelledError(error)) finish("canceled");
      else finish("buy_failed");
    });
  });
}

export async function restoreMonthly(token: string | null): Promise<string | null> {
  if (!token) return "sign_in";
  await initConnection();
  const purchases = await getAvailablePurchases();
  const mine = purchases.filter((purchase) => purchase.productId === sku());
  if (!mine.length) return "none";
  let last: string | null = "none";
  for (const purchase of mine) {
    const error = await settle(token, purchase);
    if (!error) return null;
    last = error;
  }
  return last;
}
