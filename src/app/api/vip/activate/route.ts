import {
  VIP_APPLE_PRODUCT_ID,
  VIP_GOOGLE_PRODUCT_ID,
  VIP_PRICE_EUR,
  VIP_PRODUCT_NAME,
  VIP_PRODUCT_NAME_EN,
} from "@/lib/vip";
import { NextResponse } from "next/server";

/** Store billing owns VIP. This route does not grant a free month. */
export async function POST() {
  return NextResponse.json(
    {
      error: `${VIP_PRODUCT_NAME} (${VIP_PRODUCT_NAME_EN}) is €${VIP_PRICE_EUR} per month. App Store product ${VIP_APPLE_PRODUCT_ID}. Google Play product ${VIP_GOOGLE_PRODUCT_ID}.`,
    },
    { status: 403 },
  );
}
