import { NextResponse } from "next/server";
import { getNewOpenings } from "@/lib/newsOpenings";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Newly opened Boston restaurants from dining news, verified + enriched via Google Places. */
export async function GET(request: Request) {
  const debug = new URL(request.url).searchParams.has("debug");
  try {
    const { openings, diagnostics } = await getNewOpenings();
    return NextResponse.json({ success: true, openings, ...(debug ? { diagnostics } : {}) });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unknown error", openings: [] },
      { status: 500 }
    );
  }
}
