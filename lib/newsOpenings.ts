// Server-only: discover newly OPENED Boston restaurants from dining news,
// verify + enrich each with Google Places, drop anything unmatched or closed.
import { unstable_cache } from "next/cache";
import {
  isGreaterBoston,
  lowReviewFallback,
  searchPlaces,
  toRestaurant,
  type PlaceResult,
  type ScoutedRestaurant,
} from "@/lib/places";

interface FeedConfig {
  publisher: string;
  url: string;
  /** Feed items carry only a teaser; fetch the article page for full text. */
  fetchArticle: boolean;
}

export const NEWS_FEEDS: FeedConfig[] = [
  { publisher: "Eater Boston", url: "https://boston.eater.com/rss/index.xml", fetchArticle: false },
  { publisher: "Boston.com", url: "https://www.boston.com/category/food/feed/", fetchArticle: true },
  { publisher: "Boston Magazine", url: "https://www.bostonmagazine.com/restaurants/feed/", fetchArticle: false },
];

const MAX_AGE_DAYS = 60;
const MAX_ARTICLES = 14;
const MAX_CANDIDATES = 30;
const MIN_NEWS_RESULTS = 6;
const UA = "Mozilla/5.0 (compatible; TableScout/1.0; +https://bosdining.vercel.app)";

interface FeedItem {
  publisher: string;
  fetchArticle: boolean;
  title: string;
  url: string;
  publishedAt: Date;
  categories: string[];
  html: string; // description / content
}

interface Candidate {
  /** Restaurant name, or "" for whole-story candidates (name resolved via Places). */
  name: string;
  /** Neighborhood hint from headings like "Zhu (Back Bay)". */
  hint: string;
  context: string; // text used for mood inference + status checks
  item: FeedItem;
  kind: "title" | "heading" | "story";
}

export interface NewsDiagnostics {
  feeds: { publisher: string; ok: boolean; status?: number; items: number; error?: string }[];
  articlesScanned: number;
  candidates: number;
  verified: number;
  droppedUnmatched: number;
  droppedClosed: number;
  droppedUpcoming: number;
  fallbackUsed: number;
}

/* ---------------- tiny XML/HTML helpers (no deps) ---------------- */

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘",
  rdquo: "”", ldquo: "“", mdash: "—", ndash: "–", hellip: "…", eacute: "é", egrave: "è",
  aacute: "á", oacute: "ó", iacute: "í", uacute: "ú", ntilde: "ñ", ccedil: "ç", uuml: "ü", ouml: "ö",
};

export function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

const stripTags = (s: string) =>
  decode(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " "))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : "";
}

export function parseFeed(xml: string, cfg: FeedConfig): FeedItem[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  return blocks.flatMap((b) => {
    const title = stripTags(tag(b, "title"));
    const linkAttr = b.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/i) ?? b.match(/<link[^>]*href="([^"]+)"/i);
    const url = decode(linkAttr?.[1] ?? tag(b, "link")).trim();
    const dateStr = stripTags(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date"));
    const publishedAt = new Date(dateStr);
    const categories = [
      ...Array.from(b.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)).map((m) => stripTags(m[1])),
      ...Array.from(b.matchAll(/<category[^>]*term="([^"]+)"/gi)).map((m) => decode(m[1])),
    ];
    const html = decode(tag(b, "content:encoded") || tag(b, "content") || tag(b, "description") || tag(b, "summary"));
    if (!title || !url || Number.isNaN(publishedAt.getTime())) return [];
    return [{ publisher: cfg.publisher, fetchArticle: cfg.fetchArticle, title, url, publishedAt, categories, html }];
  });
}

/* ---------------- relevance + candidate extraction ---------------- */

const OPENING_RE =
  /\b(open(s|ed|ing)?|now open|debut(s|ed)?|new (restaurant|bar|spot|cafe|café)s?|first look|soft open|grand opening|just opened|newcomers?)\b/i;
const CLOSING_RE = /\b(clos(e|es|ed|ing|ure)|shutter(s|ed|ing)?|will not reopen|last day|farewell)\b/i;
const ROUNDUP_RE =
  /(openings|new restaurants|heatmap|hottest|where to eat|best new|top \d+ new|new (bars|spots)|restaurants to try)/i;
export const UPCOMING_RE =
  /(opening date:|slated to open|expected to open|set to open|plans? to open|aims? to open|will open|coming soon|is coming to|later this (year|month|season)|next (year|month|spring|summer|fall|winter)|in (early |late )?20(2[7-9]|3\d)|(spring|summer|fall|winter) 20(2[7-9]|3\d)|liquor license|proposed)/i;
export const OPEN_NOW_RE = /(now open|has opened|opened (its doors|on|in|last|this|earlier)|officially open|is open|soft[- ]opened|debuted)/i;

const GENERIC_HEADING_RE =
  /(restaurants|where to eat|catch up|favorites|looking ahead|new locations|out-of-towners|older|doing new things|newsletter|logo|guide|to try|this month|this week|updates|news)\b|:$/i;

/** "1. Fallow Kin" → Fallow Kin; "Zhu (Back Bay)" → Zhu + hint "Back Bay" */
export function cleanHeading(raw: string): { name: string; hint: string } | null {
  let h = raw.replace(/^\((bonus!?|new)\)\s*/i, "").replace(/^\d+[.)]\s*/, "").trim();
  let hint = "";
  const paren = h.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (paren) {
    h = paren[1].trim();
    hint = paren[2].trim();
  }
  if (!h || h.length > 50 || JUNK_HEADING_RE.test(h) || GENERIC_HEADING_RE.test(h)) return null;
  if (h.split(/\s+/).length > 7) return null;
  return { name: h, hint };
}

const JUNK_HEADING_RE =
  /^(bonus|sign up|conversation|most popular|related|in related news|newsletter|advertisement|share|comments?|more from|read more|about|photos?|the dish|subscribe|what to order|the vibe|the details|why we love it)\b/i;

export function isOpeningStory(item: FeedItem): boolean {
  const hay = `${item.title} ${item.categories.join(" ")}`;
  if (CLOSING_RE.test(item.title) && !OPENING_RE.test(item.title)) return false;
  return OPENING_RE.test(hay) || /restaurant openings/i.test(item.categories.join(" "));
}

/** "Foo Opens in the South End", "Now Open: Foo", "Foo Is Now Open" → "Foo" */
export function nameFromTitle(title: string): string | null {
  const t = title.replace(/[“”"]/g, "").trim();
  const pats = [
    /^now open:\s*(.+)$/i,
    /^first look:\s*(.+?)(?:,|\s+(?:in|at|on)\s|$)/i,
    /^(.+?)\s+(?:is\s+)?(?:now\s+)?open(?:s|ed)?\b/i,
    /^(.+?)\s+debut(?:s|ed)?\b/i,
    /^(.+?)\s+(?:has\s+)?(?:soft[- ])?opened\b/i,
  ];
  for (const re of pats) {
    const m = t.match(re);
    const name = m?.[1]?.replace(/^(the\s+)?(new\s+)/i, "").trim();
    if (name && name.split(/\s+/).length <= 6 && !/\b(boston|restaurants?|bars?|openings?|spots?)$/i.test(name)) return name;
  }
  return null;
}

/** Split article HTML into (heading, section text) pairs using h2/h3 headings. */
export function sectionsFromHtml(html: string): { heading: string; text: string }[] {
  const parts = html.split(/<h[23][^>]*>/i);
  const out: { heading: string; text: string }[] = [];
  for (const part of parts.slice(1)) {
    const [headHtml, ...rest] = part.split(/<\/h[23]>/i);
    const heading = stripTags(headHtml ?? "");
    const text = stripTags(rest.join(" ")).slice(0, 1500);
    if (heading && heading.length >= 2 && heading.length <= 60 && !JUNK_HEADING_RE.test(heading) && !/[?]$/.test(heading)) {
      out.push({ heading, text });
    }
  }
  return out;
}

async function fetchText(url: string, revalidate: number): Promise<{ ok: boolean; status: number; text: string }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/atom+xml, text/html;q=0.9, */*;q=0.8" },
      next: { revalidate },
      signal: AbortSignal.timeout(10000),
    });
    return { ok: res.ok, status: res.status, text: res.ok ? await res.text() : "" };
  } catch {
    return { ok: false, status: 0, text: "" };
  }
}

/* ---------------- name matching ---------------- */

const STOP = new Set(["the", "a", "an", "and", "&", "restaurant", "bar", "boston", "cafe", "café", "kitchen", "co", "company"]);
function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !STOP.has(t));
}

/** Strict-ish match between a name from the news and a Places displayName. */
export function namesMatch(candidate: string, placeName: string): boolean {
  const a = tokens(candidate);
  const b = tokens(placeName);
  if (!a.length || !b.length) return false;
  const aj = a.join(" ");
  const bj = b.join(" ");
  if (aj === bj) return true;
  if (aj.length >= 4 && (bj.startsWith(aj) || bj.includes(` ${aj}`) || aj.startsWith(bj))) return true;
  const bs = new Set(b);
  const overlap = a.filter((t) => bs.has(t)).length;
  return overlap / a.length >= 0.75 && overlap / b.length >= 0.5;
}

/* ---------------- pipeline ---------------- */

async function buildNewOpenings(): Promise<{ openings: ScoutedRestaurant[]; diagnostics: NewsDiagnostics }> {
  const diag: NewsDiagnostics = {
    feeds: [],
    articlesScanned: 0,
    candidates: 0,
    verified: 0,
    droppedUnmatched: 0,
    droppedClosed: 0,
    droppedUpcoming: 0,
    fallbackUsed: 0,
  };

  // 1) Feeds
  const cutoff = Date.now() - MAX_AGE_DAYS * 86400_000;
  const feedResults = await Promise.all(
    NEWS_FEEDS.map(async (cfg) => {
      const r = await fetchText(cfg.url, 3600);
      const items = r.ok ? parseFeed(r.text, cfg) : [];
      diag.feeds.push({ publisher: cfg.publisher, ok: r.ok, status: r.status, items: items.length });
      return items;
    })
  );
  const stories = feedResults
    .flat()
    .filter((i) => i.publishedAt.getTime() >= cutoff && isOpeningStory(i))
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, MAX_ARTICLES);

  // 2) Candidates (title name, or h2/h3 sections for roundups / full-text posts)
  const candidates: Candidate[] = [];
  await Promise.all(
    stories.map(async (item) => {
      let html = item.html;
      if (item.fetchArticle) {
        const page = await fetchText(item.url, 21600);
        if (page.ok) html = tag(page.text, "article") || page.text;
      }
      diag.articlesScanned++;
      const fullText = stripTags(html).slice(0, 3000);
      const titleName = nameFromTitle(item.title);
      const sections = sectionsFromHtml(html)
        .map((sec) => ({ ...sec, clean: cleanHeading(sec.heading) }))
        .filter((sec) => sec.clean);
      if (titleName) {
        candidates.push({ name: titleName, hint: "", context: `${item.title}. ${fullText}`, item, kind: "title" });
      }
      if (ROUNDUP_RE.test(item.title) || (!titleName && sections.length >= 3)) {
        for (const sec of sections) {
          candidates.push({ name: sec.clean!.name, hint: sec.clean!.hint, context: sec.text, item, kind: "heading" });
        }
      } else if (!titleName) {
        // Single-restaurant story whose headline doesn't name the place:
        // let Places find it from the lede, then require the name to appear in the story.
        candidates.push({ name: "", hint: "", context: `${item.title}. ${fullText}`, item, kind: "story" });
      }
    })
  );

  // Dedupe by normalized name, keep most recent mention
  const byName = new Map<string, Candidate>();
  for (const c of candidates.sort((a, b) => b.item.publishedAt.getTime() - a.item.publishedAt.getTime())) {
    const key = c.kind === "story" ? `story:${c.item.url}` : tokens(c.name).join(" ");
    if (key && !byName.has(key)) byName.set(key, c);
  }

  // 3) Skip clearly-upcoming mentions before spending Places calls
  const toVerify: Candidate[] = [];
  for (const c of byName.values()) {
    if (UPCOMING_RE.test(c.context) && !OPEN_NOW_RE.test(c.context)) diag.droppedUpcoming++;
    else toVerify.push(c);
  }
  const limited = toVerify.slice(0, MAX_CANDIDATES);
  diag.candidates = limited.length;

  // 4) Verify + enrich with Google Places (batches of 5)
  const verified: ScoutedRestaurant[] = [];
  const seenPlaceIds = new Set<string>();
  for (let i = 0; i < limited.length; i += 5) {
    const batch = limited.slice(i, i + 5);
    const results = await Promise.all(
      batch.map(async (c) => {
        if (c.kind === "story") {
          let places: PlaceResult[] = [];
          try {
            places = await searchPlaces(`${c.context.slice(0, 220)} Boston`, 5, { restaurantsOnly: false });
          } catch {
            return [];
          }
          const storyText = tokens(c.context).join(" ");
          const match = places.find((p) => {
            const n = tokens(p.displayName?.text ?? "").join(" ");
            return n.length >= 4 && ` ${storyText} `.includes(` ${n} `) && isGreaterBoston(p);
          });
          if (match) {
            if (match.businessStatus !== "OPERATIONAL") {
              diag.droppedClosed++;
              return [];
            }
            return [{ c, place: match }];
          }
          diag.droppedUnmatched++;
          return [];
        }
        const tryNames = [c.name, ...c.name.split(/\s+(?:and|&|\+)\s+/i).filter((n) => n !== c.name)];
        for (const name of tryNames) {
          let places: PlaceResult[] = [];
          try {
            places = await searchPlaces(`${name} ${c.hint} Boston`.replace(/\s+/g, " "), 3, { restaurantsOnly: false });
          } catch {
            return [];
          }
          const match = places.find((p) => namesMatch(name, p.displayName?.text ?? "") && isGreaterBoston(p));
          if (!match) continue;
          if (match.businessStatus !== "OPERATIONAL") {
            diag.droppedClosed++;
            return [];
          }
          return [{ c, place: match }];
        }
        diag.droppedUnmatched++;
        return [];
      })
    );
    for (const { c, place } of results.flat()) {
      if (!place.id || seenPlaceIds.has(place.id)) continue;
      seenPlaceIds.add(place.id);
      verified.push(
        toRestaurant(place, {
          discovery: "news",
          vibeText: c.context,
          debutBadge: `NEW • ${c.item.publisher.toUpperCase()}`,
          tip: c.context.slice(0, 280).replace(/\s+\S*$/, "") + "…",
          source: {
            publisher: c.item.publisher,
            title: c.item.title,
            url: c.item.url,
            publishedAt: c.item.publishedAt.toISOString(),
          },
        })
      );
    }
  }
  diag.verified = verified.length;

  // 5) Fallback ONLY when news coverage is thin: < 150 Google reviews heuristic
  let openings = verified;
  if (verified.length < MIN_NEWS_RESULTS) {
    try {
      const fb = (await lowReviewFallback(MIN_NEWS_RESULTS - verified.length + 2)).filter(
        (r) => !verified.some((v) => v.name.toLowerCase() === r.name.toLowerCase())
      );
      diag.fallbackUsed = fb.length;
      openings = [...verified, ...fb];
    } catch {
      /* Places down: return what we have */
    }
  }

  return { openings, diagnostics: diag };
}

/** Cached for 6h so we don't hammer news sites or the Places API. */
export { buildNewOpenings };
export const getNewOpenings = unstable_cache(buildNewOpenings, ["news-openings-v1"], { revalidate: 21600 });
