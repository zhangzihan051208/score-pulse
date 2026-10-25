import { NextResponse } from "next/server";

export function withCors(request: Request, response: NextResponse) {
  const origin = request.headers.get("origin");
  if (!origin) return response;
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Headers", "authorization, content-type");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  response.headers.set("Vary", "Origin");
  return response;
}

export function json(request: Request, body: unknown, status = 200) {
  return withCors(request, NextResponse.json(body, { status }));
}
