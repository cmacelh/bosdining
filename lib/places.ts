// Server-only helper for Google Places API (New) Text Search.
import type { BookingPlatform } from "@/lib/bookingResolver";

export interface PlaceResult {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  addressComponents?: { longText?: string; types?: string[] }[];
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  googleMapsUri?: string;
  priceLevel?: string;
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string };
  editorialSummary?: { text?: string };
  businessStatus?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  currentOpeningHours?: { openNow?: boolean };
  photos?: { name?: string }[];
}

export type Discovery = "news" | "fallback" | "scout";

export interface NewsSource {
  publisher: string;
  title: string;
  url: string;
  publishedAt: string;
}

/** Shape the UI expects for a discovered restaurant. */
export interface ScoutedRestaurant {
  id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  isVip: boolean;
  isNewOpening: boolean;
  discovery: Discovery;
  debutBadge: string;
  vibes: string[];
  platform: BookingPlatform;
  dropRule: string;
  insiderTip: string;
  mustOrder: string[];
  slots: string[];
  websiteUri?: string;
  mapsUri?: string;
  address?: string;
  hours?: string[];
  openNow?: boolean;
  photoName?: string;
  source?: NewsSource;
}

const BOSTON_BIAS = {
  circle: { center: { latitude: 42.3555, longitude: -71.0656 }, radius: 25000 },
};

const BASE_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.addressComponents",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.priceLevel",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.editorialSummary",
  "places.businessStatus",
];

// Hours + photos (used for news enrichment and scouting cards)
const RICH_FIELDS = [...BASE_FIELDS, "places.regularOpeningHours", "places.currentOpeningHours.openNow", "places.photos"];

export class PlacesError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

export async function searchPlaces(
  textQuery: string,
  maxResultCount = 10,
  opts: { rich?: boolean; restaurantsOnly?: boolean } = {}
): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new PlacesError("GOOGLE_MAPS_API_KEY is not configured", 500);

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": (opts.rich === false ? BASE_FIELDS : RICH_FIELDS).join(","),
    },
    body: JSON.stringify({
      textQuery: textQuery.slice(0, 300),
      ...(opts.restaurantsOnly === false ? {} : { includedType: "restaurant" }),
      locationBias: BOSTON_BIAS,
      maxResultCount,
      languageCode: "en",
    }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new PlacesError(data?.error?.message || `Google Places error (${res.status})`, res.status);
  return (data.places as PlaceResult[] | undefined) ?? [];
}

function neighborhoodOf(p: PlaceResult): string {
  const find = (t: string) => p.addressComponents?.find((c) => c.types?.includes(t))?.longText;
  return find("neighborhood") || find("sublocality") || find("locality") || "Greater Boston";
}

export function isGreaterBoston(p: PlaceResult): boolean {
  const state = p.addressComponents?.find((c) => c.types?.includes("administrative_area_level_1"))?.longText;
  return state ? /massachusetts/i.test(state) : /,\s*MA\s/.test(p.formattedAddress ?? "");
}

/**
 * Mood tags inferred from descriptive text (article excerpt, place type,
 * Google's editorial summary, price level). Used to match the mood picker.
 */
export function inferVibes(text: string, p: PlaceResult): string[] {
  const hay = `${text} ${p.primaryTypeDisplayName?.text ?? ""} ${p.primaryType ?? ""} ${
    p.editorialSummary?.text ?? ""
  }`.toLowerCase();
  const pricey = p.priceLevel === "PRICE_LEVEL_EXPENSIVE" || p.priceLevel === "PRICE_LEVEL_VERY_EXPENSIVE";
  const vibes = new Set<string>();
  if (/cozy|intimate|candle|enoteca|wine bar|tiny|hideaway|neighborhood (spot|gem)|snug/.test(hay)) vibes.add("Cozy & Intimate");
  if (/date night|romantic|candle|intimate|wine bar|omakase|tasting menu/.test(hay)) vibes.add("Date Night");
  if (/cocktail|martini|lounge|speakeasy|wine bar|natural wine|spritz|negroni|bar_|aperitivo/.test(hay))
    vibes.add("Girls' Night & Cocktails");
  if (/glam|supper club|dress|chandelier|opulent|swanky|elegant|luxur|grand|velvet/.test(hay)) vibes.add("Glamorous & Dress Up");
  if (pricey || /steak|omakase|tasting menu|caviar|wagyu|fine dining|power lunch/.test(hay)) vibes.add("Power Dinner & Luxe");
  if (/patio|rooftop|terrace|outdoor|garden|waterfront|harbor view/.test(hay)) vibes.add("Patio & People Watching");
  if (/izakaya|scene|late-night|late night|buzzy|lively|dj|party|high-energy|food hall|sports bar/.test(hay))
    vibes.add("High-Energy & Scene");
  if (vibes.size === 0) vibes.add(pricey ? "Date Night" : "High-Energy & Scene");
  return Array.from(vibes).slice(0, 4);
}

export function toRestaurant(
  p: PlaceResult,
  opts: { discovery: Discovery; vibeText: string; debutBadge?: string; source?: NewsSource; tip?: string }
): ScoutedRestaurant {
  const name = p.displayName?.text || "Unnamed spot";
  const reviews = p.userRatingCount ?? 0;
  const rating = p.rating ? `${p.rating.toFixed(1)} ★ (${reviews.toLocaleString()} reviews)` : "Not yet rated";
  return {
    id: `${opts.discovery}-${p.id ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    neighborhood: neighborhoodOf(p),
    cuisine: `${p.primaryTypeDisplayName?.text || "Restaurant"} • ${rating}`,
    isVip: false,
    isNewOpening: opts.discovery !== "scout",
    discovery: opts.discovery,
    debutBadge: opts.debutBadge ?? (opts.discovery === "scout" ? "SCOUTED" : "NEW OPENING"),
    vibes: inferVibes(opts.vibeText, p),
    platform: "Resy",
    dropRule: "Check live Resy / OpenTable inventory",
    insiderTip: opts.tip || p.editorialSummary?.text || p.formattedAddress || "Pulled live via Google Places.",
    mustOrder: ["Chef's Seasonal Specials", "House Cocktails"],
    slots: ["6:00 PM", "7:30 PM", "8:45 PM"],
    websiteUri: p.websiteUri,
    mapsUri: p.googleMapsUri,
    address: p.shortFormattedAddress || p.formattedAddress,
    hours: p.regularOpeningHours?.weekdayDescriptions,
    openNow: p.currentOpeningHours?.openNow,
    photoName: p.photos?.[0]?.name,
    source: opts.source,
  };
}

/** On-demand mood/craving scout (Places only). */
export async function scoutOpenings(query: string, limit = 8): Promise<ScoutedRestaurant[]> {
  const places = await searchPlaces(query, Math.min(20, limit + 4));
  return places
    .filter((p) => p.businessStatus === "OPERATIONAL" && isGreaterBoston(p))
    .slice(0, limit)
    .map((p) => toRestaurant(p, { discovery: "scout", vibeText: query }));
}

export const FALLBACK_REVIEW_THRESHOLD = 150;

/**
 * FALLBACK ONLY: Places results with < 150 reviews, used when news sources
 * don't yield enough verified openings.
 */
export async function lowReviewFallback(limit: number): Promise<ScoutedRestaurant[]> {
  const places = await searchPlaces(
    "new restaurant recently opened Boston Back Bay South End Seaport Cambridge Somerville",
    20
  );
  return places
    .filter(
      (p) =>
        p.businessStatus === "OPERATIONAL" &&
        isGreaterBoston(p) &&
        (p.userRatingCount ?? 0) < FALLBACK_REVIEW_THRESHOLD
    )
    .slice(0, limit)
    .map((p) =>
      toRestaurant(p, {
        discovery: "fallback",
        vibeText: "",
        debutBadge: "LIKELY NEW",
        tip: `Few Google reviews yet (${p.userRatingCount ?? 0}), so likely recently opened. Not confirmed by news coverage.`,
      })
    );
}

export const DEFAULT_OPENINGS_QUERY =
  "New restaurant or cocktail bar recently opened in Boston Back Bay, South End, Seaport, or Cambridge";
