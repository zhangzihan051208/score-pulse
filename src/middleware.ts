import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseFetch } from "@/lib/supabase/timeout-fetch";

function withCors(request: NextRequest, response: NextResponse) {
  if (!request.nextUrl.pathname.startsWith("/api/")) return response;
  const origin = request.headers.get("origin");
  if (!origin) return response;
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Headers", "authorization, content-type");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  response.headers.set("Vary", "Origin");
  return response;
}

export async function middleware(request: NextRequest) {
  if (request.method === "OPTIONS" && request.nextUrl.pathname.startsWith("/api/")) {
    return withCors(request, new NextResponse(null, { status: 204 }));
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return withCors(request, NextResponse.next());

  const hasSession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.value.length > 0);
  if (!hasSession) return withCors(request, NextResponse.next());

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(url, anon, {
    global: { fetch: supabaseFetch },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await Promise.race([
    supabase.auth.getUser().catch(() => null),
    new Promise((resolve) => setTimeout(resolve, 1_800)),
  ]);
  return withCors(request, response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
