// Server-only helper for Google Places API (New) Text Search.
import type { BookingPlatform } from "@/lib/bookingResolver";

export interface PlaceResult {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  addressComponents?: { longText?: string; types?: string[] }[];
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  priceLevel?: string;
  primaryTypeDisplayName?: { text?: string };
  editorialSummary?: { text?: string };
  businessStatus?: string;
}

/** Shape the UI expects for a scouted recommendation. */
export interface ScoutedRestaurant {
  id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  isVip: boolean;
  isNewOpening: true;
  debutBadge: string;
  vibes: string[];
  platform: BookingPlatform;
  dropRule: string;
  insiderTip: string;
  mustOrder: string[];
  slots: string[];
  websiteUri?: string;
}

const BOSTON_BIAS = {
  circle: { center: { latitude: 42.3555, longitude: -71.0656 }, radius: 25000 },
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.priceLevel",
  "places.primaryTypeDisplayName",
  "places.editorialSummary",
  "places.businessStatus",
].join(",");

export class PlacesError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

export async function searchPlaces(textQuery: string, maxResultCount = 10): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new PlacesError("GOOGLE_MAPS_API_KEY is not configured", 500);

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: textQuery.slice(0, 300),
      includedType: "restaurant",
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

/** Heuristic vibe tags from the query + place type so mood filters still work on scouted spots. */
function inferVibes(query: string, p: PlaceResult): string[] {
  const hay = `${query} ${p.primaryTypeDisplayName?.text ?? ""} ${p.editorialSummary?.text ?? ""}`.toLowerCase();
  const vibes = new Set<string>();
  if (/cozy|intimate|candle|wine bar|enoteca/.test(hay)) vibes.add("Cozy & Intimate");
  if (/date/.test(hay)) vibes.add("Date Night");
  if (/cocktail|martini|lounge|bar\b/.test(hay)) vibes.add("Girls' Night & Cocktails");
  if (/glam|supper club|dress|luxury|grand/.test(hay)) vibes.add("Glamorous & Dress Up");
  if (/steak|luxury|power|omakase/.test(hay)) vibes.add("Power Dinner & Luxe");
  if (/patio|rooftop|terrace/.test(hay)) vibes.add("Patio & People Watching");
  if (/izakaya|scene|late-night|high-energy|hit list|heatmap/.test(hay)) vibes.add("High-Energy & Scene");
  if (vibes.size === 0) vibes.add("Date Night");
  return Array.from(vibes).slice(0, 3);
}

export function toScoutedRestaurant(p: PlaceResult, query: string): ScoutedRestaurant {
  const name = p.displayName?.text || "Unnamed spot";
  const reviews = p.userRatingCount ?? 0;
  const rating = p.rating ? `${p.rating.toFixed(1)} ★ (${reviews.toLocaleString()} reviews)` : "Not yet rated";
  // Few reviews is a decent proxy for "recently opened"
  const debutBadge = reviews > 0 && reviews < 150 ? "JUST OPENED" : reviews === 0 ? "BRAND NEW" : "ON THE RADAR";

  return {
    id: `scout-${p.id ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    neighborhood: neighborhoodOf(p),
    cuisine: `${p.primaryTypeDisplayName?.text || "Restaurant"} • ${rating}`,
    isVip: false,
    isNewOpening: true,
    debutBadge,
    vibes: inferVibes(query, p),
    platform: "Resy",
    dropRule: "Check live Resy / OpenTable inventory",
    insiderTip: p.editorialSummary?.text || p.formattedAddress || "Pulled live via Google Places.",
    mustOrder: ["Chef's Seasonal Specials", "House Cocktails"],
    slots: ["6:00 PM", "7:30 PM", "8:45 PM"],
    websiteUri: p.websiteUri,
  };
}

export async function scoutOpenings(query: string, limit = 8): Promise<ScoutedRestaurant[]> {
  const places = await searchPlaces(query, Math.min(20, limit + 4));
  return places
    .filter((p) => !p.businessStatus || p.businessStatus === "OPERATIONAL")
    .slice(0, limit)
    .map((p) => toScoutedRestaurant(p, query));
}

export const DEFAULT_OPENINGS_QUERY =
  "New restaurant or cocktail bar recently opened in Boston Back Bay, South End, Seaport, or Cambridge";
