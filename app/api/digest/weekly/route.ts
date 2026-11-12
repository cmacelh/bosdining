import { NextResponse } from "next/server";
import { DEFAULT_OPENINGS_QUERY, scoutOpenings, type ScoutedRestaurant } from "@/lib/places";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function renderDigest(openings: ScoutedRestaurant[]): string {
  const cards = openings
    .map(
      (r) => `
      <tr><td style="padding:16px 0;border-bottom:1px solid #2a2a2e">
        <div style="font-size:10px;letter-spacing:2px;color:#F6C6D4;text-transform:uppercase">✨ ${esc(r.debutBadge)} • ${esc(r.neighborhood)}</div>
        <div style="font-family:Georgia,serif;font-size:20px;color:#DBDBDB;margin:4px 0">${esc(r.name)}</div>
        <div style="font-size:12px;color:#9CA3AF">${esc(r.cuisine)}</div>
        <div style="font-size:12px;color:#DBDBDB;margin-top:6px">${esc(r.insiderTip)}</div>
        ${r.websiteUri ? `<a href="${esc(r.websiteUri)}" style="font-size:12px;color:#C6B16C">Visit website ↗</a>` : ""}
      </td></tr>`
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#09090B;font-family:Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:24px">
    <tr><td style="color:#C6B16C;font-family:Georgia,serif;font-size:26px">♛ TableScout</td></tr>
    <tr><td style="color:#9CA3AF;font-size:12px;padding-bottom:12px">Your Thursday Boston Openings Digest</td></tr>
    ${cards || '<tr><td style="color:#9CA3AF">No new openings found this week.</td></tr>'}
  </table></body></html>`;
}

async function sendDigest(to: string) {
  const openings = await scoutOpenings(DEFAULT_OPENINGS_QUERY, 8);
  const html = renderDigest(openings);
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return { success: true, simulated: true, count: openings.length, previewHtml: html };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.DIGEST_FROM_EMAIL || "TableScout <onboarding@resend.dev>",
      to: [to],
      subject: `♛ TableScout: ${openings.length} Boston openings this week`,
      html,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false, error: data?.message || `Resend error (${res.status})` };
  return { success: true, simulated: false, count: openings.length, id: data?.id };
}

/** Manual trigger from the UI: body { email } */
export async function POST(request: Request) {
  let email = "";
  try {
    email = String((await request.json())?.email ?? "").trim();
  } catch {
    /* ignore */
  }
  email = email || process.env.DIGEST_TO_EMAIL || "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ success: false, error: "Enter a valid email address" }, { status: 400 });
  }
  try {
    const result = await sendDigest(email);
    return NextResponse.json(result, { status: result.success ? 200 : 502 });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}

/** Vercel Cron (Thursdays) — protected by CRON_SECRET, sends to DIGEST_TO_EMAIL. */
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const to = process.env.DIGEST_TO_EMAIL || "";
  if (!EMAIL_RE.test(to)) {
    return NextResponse.json({ success: false, error: "DIGEST_TO_EMAIL not configured" }, { status: 500 });
  }
  try {
    const { previewHtml: _omit, ...result } = (await sendDigest(to)) as Record<string, unknown>;
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
