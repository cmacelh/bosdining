import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Downtown Boston, ~25 km radius (covers Cambridge, Somerville, Brookline)
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
].join(",");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim().slice(0, 200);

  if (!query) {
    return NextResponse.json({ success: false, error: "Missing ?q= search term", places: [] }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "GOOGLE_MAPS_API_KEY is not configured", places: [] },
      { status: 500 }
    );
  }

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        includedType: "restaurant",
        locationBias: BOSTON_BIAS,
        maxResultCount: 10,
        languageCode: "en",
      }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data?.error?.message || `Google Places error (${res.status})`, places: [] },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, places: data.places || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message, places: [] }, { status: 500 });
  }
}
