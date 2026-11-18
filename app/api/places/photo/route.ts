import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Only allow genuine Places photo resource names (prevents using this as an open proxy).
const NAME_RE = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

/** Proxies a Google Places photo so the API key never reaches the browser. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";
  const w = Math.min(1200, Math.max(100, Number(searchParams.get("w")) || 640));
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!NAME_RE.test(name)) return NextResponse.json({ error: "Invalid photo name" }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const res = await fetch(
    `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${w}&skipHttpRedirect=true&key=${encodeURIComponent(apiKey)}`,
    { next: { revalidate: 86400 } }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.photoUri) return NextResponse.json({ error: "Photo unavailable" }, { status: 404 });

  return NextResponse.redirect(data.photoUri, {
    status: 302,
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  });
}
