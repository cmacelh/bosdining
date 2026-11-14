// Minimal server-only Supabase REST (PostgREST) client — no extra dependency.
// Uses the service role key, so NEVER import this from a client component.

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigured = Boolean(url && serviceKey);

export async function supabaseRest<T = unknown>(
  path: string,
  init: RequestInit & { prefer?: string } = {}
): Promise<T> {
  if (!url || !serviceKey) throw new Error("Supabase is not configured");
  const { prefer, headers, ...rest } = init;
  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...rest,
    cache: "no-store",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
      ...(headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || `Supabase error (${res.status})`);
  return data as T;
}
