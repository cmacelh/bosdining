import { NextResponse } from "next/server";
import { supabaseConfigured, supabaseRest } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const VERDICTS = ["Obsessed / VIP", "Would Return", "One & Done", "Skip"] as const;

interface FeedbackRow {
  restaurant_id: string;
  restaurant_name: string;
  rating: number;
  verdict: (typeof VERDICTS)[number];
  favorite_dishes: string;
  best_table_note: string;
  personal_notes: string;
  last_visited: string | null;
}

export async function GET() {
  if (!supabaseConfigured) {
    // App falls back to localStorage — not an error for the UI
    return NextResponse.json({ success: true, configured: false, feedback: [] });
  }
  try {
    const feedback = await supabaseRest<FeedbackRow[]>(
      "tasting_feedback?select=restaurant_id,restaurant_name,rating,verdict,favorite_dishes,best_table_note,personal_notes,last_visited&order=updated_at.desc"
    );
    return NextResponse.json({ success: true, configured: true, feedback });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unknown error", feedback: [] },
      { status: 500 }
    );
  }
}

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const rating = Number(body.rating);
  const verdict = body.verdict as FeedbackRow["verdict"];
  const restaurantId = clip(body.restaurantId, 200);
  if (!restaurantId || !Number.isInteger(rating) || rating < 1 || rating > 5 || !VERDICTS.includes(verdict)) {
    return NextResponse.json({ success: false, error: "Invalid feedback payload" }, { status: 400 });
  }

  const lastVisited = clip(body.lastVisited, 10);
  const row: FeedbackRow = {
    restaurant_id: restaurantId,
    restaurant_name: clip(body.restaurantName, 200),
    rating,
    verdict,
    favorite_dishes: clip(body.favoriteDishes, 1000),
    best_table_note: clip(body.bestTableNote, 500),
    personal_notes: clip(body.personalNotes, 4000),
    last_visited: /^\d{4}-\d{2}-\d{2}$/.test(lastVisited) ? lastVisited : null,
  };

  if (!supabaseConfigured) {
    return NextResponse.json({ success: true, configured: false, persisted: "local-only" });
  }

  try {
    await supabaseRest("tasting_feedback?on_conflict=restaurant_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify(row),
    });
    return NextResponse.json({ success: true, configured: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
