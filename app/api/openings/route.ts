import { NextResponse } from "next/server";
import { DEFAULT_OPENINGS_QUERY, PlacesError, scoutOpenings } from "@/lib/places";

export const dynamic = "force-dynamic";

async function respond(query: string) {
  try {
    const openings = await scoutOpenings(query);
    return NextResponse.json({ success: true, query, openings });
  } catch (e) {
    const status = e instanceof PlacesError ? e.status : 500;
    const error = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error, openings: [] }, { status });
  }
}

/** Initial feed on page load. */
export async function GET() {
  return respond(DEFAULT_OPENINGS_QUERY);
}

/** On-demand scout: body { query: string } */
export async function POST(request: Request) {
  let query = "";
  try {
    const body = await request.json();
    query = typeof body?.query === "string" ? body.query.trim() : "";
  } catch {
    /* fall through */
  }
  return respond(query || DEFAULT_OPENINGS_QUERY);
}
