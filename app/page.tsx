"use client";
import React, { useMemo, useState } from "react";
import { getBookingUrl, type BookingPlatform } from "@/lib/bookingResolver";

export type Platform = BookingPlatform;

export interface Restaurant {
  id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  isVip: boolean;
  isLive?: boolean;
  vibes: string[];
  platform: Platform;
  dropRule: string;
  insiderTip: string;
  mustOrder: string[];
  slots: string[];
}

interface ThemeTokens {
  id: string;
  label: string;
  bgCanvas: string;
  bgHero: string;
  bgCard: string;
  bgInput: string;
  textPrimary: string;
  textMuted: string;
  heroText: string;
  heroMuted: string;
  accentPink: string;
  accentGold: string;
  ctaFill: string;
  ctaText: string;
  onAccent: string;
}

const SAVED_THEMES: Record<string, ThemeTokens> = {
  obsidianDark: {
    id: "obsidianDark",
    label: "Obsidian Dark (Your Custom)",
    bgCanvas: "#09090B",
    bgHero: "#111115",
    bgCard: "#1B1B1D",
    bgInput: "#1B1B1D",
    textPrimary: "#DBDBDB",
    textMuted: "#9CA3AF",
    heroText: "#DBDBDB",
    heroMuted: "#9CA3AF",
    accentPink: "#F6C6D4",
    accentGold: "#C6B16C",
    ctaFill: "#F6C6D4",
    ctaText: "#09090B",
    onAccent: "#09090B",
  },
  obsidianLight: {
    id: "obsidianLight",
    label: "Obsidian Inverted Light",
    bgCanvas: "#FAF8F6",
    bgHero: "#111115", // dark hero console on light canvas, by design
    bgCard: "#FFFFFF",
    bgInput: "#1B1B1D",
    textPrimary: "#111115",
    textMuted: "#52525B",
    heroText: "#DBDBDB",
    heroMuted: "#9CA3AF",
    accentPink: "#E899B1",
    accentGold: "#B39744",
    ctaFill: "#111115",
    ctaText: "#F6C6D4",
    onAccent: "#09090B",
  },
  gildedChampagne: {
    id: "gildedChampagne",
    label: "Gilded Champagne Light",
    bgCanvas: "#FBF7F0",
    bgHero: "#F4ECE1",
    bgCard: "#FFFFFF",
    bgInput: "#FFFFFF",
    textPrimary: "#0A0A0C",
    textMuted: "#57534E",
    heroText: "#0A0A0C",
    heroMuted: "#57534E",
    accentPink: "#F6C6D4",
    accentGold: "#C59B27",
    ctaFill: "#C59B27",
    ctaText: "#FFFFFF",
    onAccent: "#0A0A0C",
  },
};

const INITIAL_RESTAURANTS: Restaurant[] = [
  // --- 6 PINNED VIP FAVORITES ---
  {
    id: "coppa",
    name: "Coppa",
    neighborhood: "South End",
    cuisine: "Italian Enoteca",
    isVip: true,
    vibes: ["Cozy & Intimate", "Date Night", "Patio & People Watching"],
    platform: "Resy",
    dropRule: "30 days out at 10:00 AM EST",
    insiderTip: "Walk-in seats at the tiny marble bar open at 5:00 PM sharp; patio tables along Shawmut Ave are prime in warm weather.",
    mustOrder: ["Spicy Soppressata Pizza", "Carbonara", "House Charcuterie"],
    slots: ["5:45 PM", "7:15 PM", "8:30 PM"],
  },
  {
    id: "ava",
    name: "Ava (Eva Newbury)",
    neighborhood: "Back Bay",
    cuisine: "Mediterranean Bistro & Cocktails",
    isVip: true,
    vibes: ["Girls' Night & Cocktails", "Patio & People Watching", "Glamorous & Dress Up"],
    platform: "OpenTable",
    dropRule: "30 days out at 9:00 AM EST",
    insiderTip: "Ask for the front Newbury Street terrace tables for peak people-watching or book late-night lounge seating.",
    mustOrder: ["Whipped Feta", "Truffle Flatbread", "Espresso Martini Tower"],
    slots: ["6:00 PM", "7:30 PM", "8:45 PM"],
  },
  {
    id: "la-padrona",
    name: "La Padrona",
    neighborhood: "Back Bay",
    cuisine: "Grand Italian inside Raffles",
    isVip: true,
    vibes: ["Glamorous & Dress Up", "Power Dinner & Luxe", "Date Night"],
    platform: "Resy",
    dropRule: "14 days out at 9:00 AM EST",
    insiderTip: "Arrive 20 mins early for a drink at the dramatic Raffles staircase bar; request a velvet main-dining booth.",
    mustOrder: ["Carpaccio alla Cipriani", "Rigatoni alla Vodka", "Bistecca Fiorentina"],
    slots: ["5:30 PM", "7:00 PM", "9:00 PM"],
  },
  {
    id: "uni",
    name: "Uni",
    neighborhood: "Back Bay",
    cuisine: "Sashimi & Late-Night Izakaya",
    isVip: true,
    vibes: ["High-Energy & Scene", "Date Night", "Power Dinner & Luxe"],
    platform: "Resy",
    dropRule: "30 days out at 10:00 AM EST",
    insiderTip: "Sit at the sushi bar to watch master knife work up close; late-night ramen and off-menu handrolls drop on weekends.",
    mustOrder: ["Corn Fried Rice", "Tuna Foie Gras", "Otoro Nigiri", "Uni Spoon"],
    slots: ["6:15 PM", "8:00 PM", "9:30 PM"],
  },
  {
    id: "contessa",
    name: "Contessa",
    neighborhood: "Back Bay",
    cuisine: "Northern Italian Rooftop",
    isVip: true,
    vibes: ["Glamorous & Dress Up", "Patio & People Watching", "Power Dinner & Luxe"],
    platform: "SevenRooms",
    dropRule: "30 days out at 9:00 AM EST",
    insiderTip: "The glass-enclosed conservatory roof deck offers panoramic Public Garden views year-round.",
    mustOrder: ["Spicy Lobster Capellini", "Chianina Carpaccio", "Veal Milanese"],
    slots: ["5:00 PM", "7:15 PM", "8:45 PM"],
  },
  {
    id: "mooo",
    name: "Mooo....",
    neighborhood: "Beacon Hill",
    cuisine: "Modern Steakhouse & Wine Cellar",
    isVip: true,
    vibes: ["Cozy & Intimate", "Power Dinner & Luxe", "Date Night"],
    platform: "OpenTable",
    dropRule: "60 days out at 12:00 AM EST",
    insiderTip: "Tucked inside XV Beacon; request a quiet corner leather booth in the main dining room.",
    mustOrder: ["Japanese A5 Wagyu", "Beef Wellington Dumplings", "Bone Marrow Butter"],
    slots: ["6:00 PM", "7:45 PM", "9:15 PM"],
  },

  // --- 14 CURATED DISCOVERY SPOTS (BOSTON, CAMBRIDGE, SOMERVILLE, BROOKLINE) ---
  {
    id: "giulia",
    name: "Giulia",
    neighborhood: "Cambridge",
    cuisine: "Artisanal Pasta & Regional Italian",
    isVip: false,
    vibes: ["Cozy & Intimate", "Date Night"],
    platform: "Resy",
    dropRule: "14 days out at 9:00 AM EST",
    insiderTip: "The 10-seat live pasta table and full-menu bar seats are held strictly for walk-ins starting at 5:00 PM.",
    mustOrder: ["Pappardelle with Wild Boar", "Warm Semolina Cake", "Burrata"],
    slots: ["5:15 PM", "8:45 PM"],
  },
  {
    id: "sarma",
    name: "Sarma",
    neighborhood: "Somerville",
    cuisine: "Eastern Mediterranean Meze",
    isVip: false,
    vibes: ["High-Energy & Scene", "Girls' Night & Cocktails", "Date Night"],
    platform: "Resy",
    dropRule: "30 days out at 10:00 AM EST",
    insiderTip: "Don't sleep on the tray-passed nightly specials—say yes whenever servers circulate with hot cornbread or fried chicken.",
    mustOrder: ["Black Sea Cornbread", "Sesame Fried Chicken", "Lamb Köfte Sliders"],
    slots: ["5:30 PM", "9:00 PM"],
  },
  {
    id: "pammys",
    name: "Pammy's",
    neighborhood: "Cambridge",
    cuisine: "New American Trattoria",
    isVip: false,
    vibes: ["Cozy & Intimate", "Date Night", "Glamorous & Dress Up"],
    platform: "Resy",
    dropRule: "30 days out at 9:00 AM EST",
    insiderTip: "Grab seats near the central hearth fireplace on chilly nights; bar walk-ins take the full à la carte menu.",
    mustOrder: ["Lumache with Gochujang Bolognese", "Chris's Focaccia", "Panna Cotta"],
    slots: ["5:45 PM", "7:30 PM", "8:45 PM"],
  },
  {
    id: "yvonnes",
    name: "Yvonne's",
    neighborhood: "Downtown Crossing",
    cuisine: "Modern Supper Club & Speakeasy",
    isVip: false,
    vibes: ["Glamorous & Dress Up", "High-Energy & Scene", "Girls' Night & Cocktails"],
    platform: "OpenTable",
    dropRule: "30 days out at 10:00 AM EST",
    insiderTip: "Enter through hair-salon front; ask the host if the hidden subterranean Library Bar has open velvet couches.",
    mustOrder: ["Crispy Tuna & Feta", "Dirty Tavern Flatbread", "Baked Alaska"],
    slots: ["6:30 PM", "8:15 PM", "9:30 PM"],
  },
  {
    id: "krasi",
    name: "Krasi",
    neighborhood: "Back Bay",
    cuisine: "Greek Meze & Natural Wine Bar",
    isVip: false,
    vibes: ["High-Energy & Scene", "Girls' Night & Cocktails", "Date Night"],
    platform: "Resy",
    dropRule: "30 days out at 10:00 AM EST",
    insiderTip: "Let the sommelier pour you an off-list indigenous Greek skin-contact wine; patio opens onto Gloucester St.",
    mustOrder: ["House Charcuterie Board", "Kopisti Dip", "Grilled Octopus"],
    slots: ["5:30 PM", "7:45 PM", "9:15 PM"],
  },
  {
    id: "grill-23",
    name: "Grill 23 & Bar",
    neighborhood: "Back Bay",
    cuisine: "Iconic Prime Steakhouse",
    isVip: false,
    vibes: ["Power Dinner & Luxe", "Glamorous & Dress Up"],
    platform: "OpenTable",
    dropRule: "60 days out at 9:00 AM EST",
    insiderTip: "Downstairs marble columns have high-energy buzz; ask for the quieter upstairs balcony for intimate conversation.",
    mustOrder: ["100-Day Aged Prime Ribeye", "Shellfish Tower", "Coconut Cake"],
    slots: ["5:45 PM", "7:15 PM", "8:30 PM"],
  },
  {
    id: "mahaniyom",
    name: "Mahaniyom",
    neighborhood: "Brookline",
    cuisine: "Regional Thai Tapas & Craft Cocktails",
    isVip: false,
    vibes: ["Cozy & Intimate", "Date Night", "Girls' Night & Cocktails"],
    platform: "Resy",
    dropRule: "14 days out at 12:00 AM EST",
    insiderTip: "Tiny room in Brookline Village—set an alarm for midnight 14 days out, or put your name in at the bar at 4:50 PM.",
    mustOrder: ["Crispy Basil Chicken Wings", "Massaman Beef", "Thai Tea Tres Leches"],
    slots: ["5:15 PM", "8:30 PM"],
  },
  {
    id: "oleana",
    name: "Oleana",
    neighborhood: "Cambridge",
    cuisine: "Eastern Mediterranean Garden Dining",
    isVip: false,
    vibes: ["Cozy & Intimate", "Patio & People Watching", "Date Night"],
    platform: "Resy",
    dropRule: "30 days out at 9:00 AM EST",
    insiderTip: "The secret walled garden patio is one of the most magical outdoor spaces in New England from May through October.",
    mustOrder: ["Spinach Falafel", "Whipped Feta", "Sultan's Delight", "Baked Alaska"],
    slots: ["5:30 PM", "8:45 PM"],
  },
  {
    id: "srv",
    name: "SRV",
    neighborhood: "South End",
    cuisine: "Venetian Bacaro & Arsenale Pasta",
    isVip: false,
    vibes: ["Date Night", "Cozy & Intimate", "Patio & People Watching"],
    platform: "OpenTable",
    dropRule: "30 days out at 9:00 AM EST",
    insiderTip: "The front cicchetti bar requires zero reservations and has a hidden back courtyard patio.",
    mustOrder: ["Pork Meatballs", "Black Pepper Bigoli", "Cod Mantecato"],
    slots: ["6:00 PM", "7:30 PM", "8:45 PM"],
  },
  {
    id: "fox-and-knife",
    name: "Fox & the Knife",
    neighborhood: "South Boston",
    cuisine: "Modena-Inspired Enoteca",
    isVip: false,
    vibes: ["High-Energy & Scene", "Girls' Night & Cocktails", "Date Night"],
    platform: "Resy",
    dropRule: "30 days out at 10:00 AM EST",
    insiderTip: "High-top bar seats are walk-in friendly; killer aperitivo spritz program.",
    mustOrder: ["Taleggio Stuffed Focaccia", "Tagliatelle Bolognese", "Rigatoni"],
    slots: ["5:45 PM", "7:15 PM", "8:45 PM"],
  },
  {
    id: "celeste",
    name: "Celeste",
    neighborhood: "Somerville",
    cuisine: "Peruvian Cevichería & Pisco Bar",
    isVip: false,
    vibes: ["Cozy & Intimate", "Date Night"],
    platform: "Resy",
    dropRule: "14 days out at 10:00 AM EST",
    insiderTip: "Intimate jewel-box room in Union Square; order the classic Pisco Sour and rotating daily market ceviche.",
    mustOrder: ["Ceviche Mixto", "Lomo Saltado", "Pisco Sour"],
    slots: ["6:00 PM", "8:00 PM"],
  },
  {
    id: "alden-harlow",
    name: "Alden & Harlow",
    neighborhood: "Cambridge",
    cuisine: "Subterranean New American",
    isVip: false,
    vibes: ["High-Energy & Scene", "Date Night", "Girls' Night & Cocktails"],
    platform: "Resy",
    dropRule: "30 days out at 9:00 AM EST",
    insiderTip: "Ask for your Secret Burger as soon as you sit down—they only make a limited batch each evening.",
    mustOrder: ["Secret Burger", "Charred Broccoli", "Smoked Brisket"],
    slots: ["5:30 PM", "7:30 PM", "9:00 PM"],
  },
  {
    id: "extra-dirty",
    name: "Extra Dirty Cocktail Club",
    neighborhood: "Back Bay",
    cuisine: "Martini Lounge & Caviar Service",
    isVip: false,
    vibes: ["Glamorous & Dress Up", "Girls' Night & Cocktails", "High-Energy & Scene"],
    platform: "Resy",
    dropRule: "14 days out at 10:00 AM EST",
    insiderTip: "Custom freezer-door martini service with bespoke garnishes and late-night vinyl DJ sets.",
    mustOrder: ["Filthy Freezer Martini", "Caviar Bump & Tater Tots", "Wagyu Katsu Sando"],
    slots: ["6:00 PM", "8:00 PM", "9:45 PM"],
  },
  {
    id: "o-ya",
    name: "O Ya",
    neighborhood: "Leather District",
    cuisine: "Grand 20-Course Nigiri Omakase",
    isVip: false,
    vibes: ["Power Dinner & Luxe", "Date Night", "Glamorous & Dress Up"],
    platform: "Resy",
    dropRule: "60 days out at 9:00 AM EST",
    insiderTip: "Book the chef's counter for the best theater; put yourself on the Resy Notify list—cancellations frequently clear 24h out.",
    mustOrder: ["20-Course Omakase", "Fried Kumamoto Oyster Nigiri", "A5 Wagyu Nigiri"],
    slots: ["5:30 PM", "8:30 PM"],
  },
];

const VIBES = [
  "All Vibes",
  "Glamorous & Dress Up",
  "Cozy & Intimate",
  "High-Energy & Scene",
  "Date Night",
  "Girls' Night & Cocktails",
  "Patio & People Watching",
  "Power Dinner & Luxe",
];

/* ---------- Google Places (New) helpers ---------- */
interface PlaceAddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}
interface Place {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  addressComponents?: PlaceAddressComponent[];
  rating?: number;
  userRatingCount?: number;
  primaryTypeDisplayName?: { text?: string };
}

function neighborhoodFromPlace(p: Place): string {
  const find = (type: string) => p.addressComponents?.find((c) => c.types?.includes(type))?.longText;
  return (
    find("neighborhood") ||
    find("sublocality") ||
    find("locality") ||
    p.formattedAddress?.split(",")[1]?.trim() ||
    "Greater Boston"
  );
}

function placeToRestaurant(p: Place, fallbackName: string): Restaurant {
  const ratingBits = p.rating
    ? ` • ${p.rating.toFixed(1)} ★${p.userRatingCount ? ` (${p.userRatingCount.toLocaleString()} reviews)` : ""}`
    : "";
  return {
    id: `live-${p.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
    name: p.displayName?.text || fallbackName,
    neighborhood: neighborhoodFromPlace(p),
    cuisine: `${p.primaryTypeDisplayName?.text || "Restaurant"}${ratingBits}`,
    isVip: false,
    isLive: true,
    vibes: ["Date Night", "Cozy & Intimate"],
    platform: "Resy",
    dropRule: "Check live Resy / OpenTable inventory",
    insiderTip: p.formattedAddress || "Pulled live via Google Places API.",
    mustOrder: ["Chef's Seasonal Tasting", "House Cocktails"],
    slots: ["6:00 PM", "7:30 PM", "8:45 PM"],
  };
}

function todayISO(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function TableScoutApp() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(INITIAL_RESTAURANTS);
  const [activeThemeKey, setActiveThemeKey] = useState<string>("obsidianDark");
  const [selectedVibe, setSelectedVibe] = useState<string>("All Vibes");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("All");
  const [vipOnly, setVipOnly] = useState<boolean>(false);
  const [partySize, setPartySize] = useState<number>(2);
  const [date, setDate] = useState<string>("2026-11-07");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchingLive, setIsSearchingLive] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newSpotName, setNewSpotName] = useState<string>("");
  const [newSpotNeighborhood, setNewSpotNeighborhood] = useState<string>("Back Bay");
  const [newSpotPlatform, setNewSpotPlatform] = useState<Platform>("Resy");

  const theme = SAVED_THEMES[activeThemeKey];

  const neighborhoods = useMemo(
    () => ["All", ...Array.from(new Set(restaurants.map((r) => r.neighborhood)))],
    [restaurants]
  );

  const toggleVip = (id: string) => {
    setRestaurants((prev) => prev.map((r) => (r.id === id ? { ...r, isVip: !r.isVip } : r)));
  };

  // Live Google Places search via /api/restaurants/search
  const handleLivePlacesSearch = async () => {
    const term = searchQuery.trim();
    if (!term || isSearchingLive) return;
    setIsSearchingLive(true);
    setLiveError(null);
    try {
      const res = await fetch(`/api/restaurants/search?q=${encodeURIComponent(`${term} Boston restaurant`)}`);
      const data: { success?: boolean; error?: string; places?: Place[] } = await res.json();
      if (!res.ok || data.success === false) {
        setLiveError(data.error || "Live search failed. Try again.");
        return;
      }
      const places = data.places ?? [];
      if (places.length === 0) {
        setLiveError(`No Google results for “${term}”.`);
        return;
      }
      const mapped = places.slice(0, 6).map((p) => placeToRestaurant(p, term));
      setRestaurants((prev) => {
        const existing = new Set(prev.map((r) => r.name.toLowerCase()));
        const fresh = mapped.filter((m) => !existing.has(m.name.toLowerCase()));
        return [...fresh, ...prev];
      });
      // Clear the text filter so live results aren't hidden by name mismatch
      setSearchQuery("");
      setSelectedNeighborhood("All");
    } catch (e) {
      console.error("Live search error:", e);
      setLiveError("Network error during live search.");
    } finally {
      setIsSearchingLive(false);
    }
  };

  const handleAddCustomSpot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpotName.trim()) return;
    const added: Restaurant = {
      id: `custom-${Date.now()}`,
      name: newSpotName.trim(),
      neighborhood: newSpotNeighborhood.trim() || "Greater Boston",
      cuisine: "Custom Curated Spot",
      isVip: true,
      vibes: ["Date Night", "Glamorous & Dress Up"],
      platform: newSpotPlatform,
      dropRule: "30 days out at 9:00 AM EST",
      insiderTip: "Added to your personal TableScout roster.",
      mustOrder: ["House Specialties"],
      slots: ["6:00 PM", "7:30 PM", "8:30 PM"],
    };
    setRestaurants((prev) => [added, ...prev]);
    setNewSpotName("");
    setShowAddModal(false);
  };

  const filtered = restaurants
    .filter((r) => {
      if (vipOnly && !r.isVip) return false;
      if (selectedVibe !== "All Vibes" && !r.vibes.includes(selectedVibe)) return false;
      if (selectedNeighborhood !== "All" && r.neighborhood !== selectedNeighborhood) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.neighborhood.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          r.mustOrder.some((d) => d.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => Number(b.isVip) - Number(a.isVip));

  const vipCount = restaurants.filter((r) => r.isVip).length;

  const inputStyle: React.CSSProperties = {
    backgroundColor: theme.bgInput,
    borderColor: `${theme.accentGold}4D`,
    color: theme.heroText,
  };

  return (
    <div
      style={{ backgroundColor: theme.bgCanvas, color: theme.textPrimary }}
      className="min-h-screen font-sans p-6 transition-colors duration-300"
    >
      {/* Header & Theme Switcher */}
      <header
        style={{ borderColor: `${theme.accentGold}33` }}
        className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b mb-8"
      >
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span style={{ color: theme.accentGold }} className="text-2xl">♛</span>
            <h1 className="text-3xl font-serif tracking-wide">TableScout</h1>
            <span
              style={{ backgroundColor: theme.bgHero, borderColor: `${theme.accentGold}66`, color: theme.accentGold }}
              className="px-3 py-1 border text-xs uppercase tracking-widest rounded-full"
            >
              Boston Reserve Edition
            </span>
          </div>
          <p style={{ color: theme.textMuted }} className="text-xs mt-1">
            {vipCount} Pinned VIP Favorites • {restaurants.length} Total Spots • Live Google Places Discovery
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Object.values(SAVED_THEMES).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveThemeKey(t.id)}
              aria-pressed={activeThemeKey === t.id}
              style={{
                backgroundColor: activeThemeKey === t.id ? theme.accentPink : theme.bgCard,
                color: activeThemeKey === t.id ? theme.onAccent : theme.textPrimary,
                borderColor: `${theme.accentGold}55`,
              }}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => setShowAddModal(true)}
            style={{ backgroundColor: theme.accentGold, color: theme.onAccent }}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
          >
            + Add Spot
          </button>
        </div>
      </header>

      {/* Filter & Search Console */}
      <div
        style={{ backgroundColor: theme.bgHero, borderColor: `${theme.accentGold}4D`, color: theme.heroText }}
        className="max-w-6xl mx-auto border rounded-xl p-5 mb-8 shadow-2xl"
      >
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={date}
              min={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
              className="px-3 py-2 rounded-lg text-xs border"
              aria-label="Reservation date"
            />

            <div className="flex gap-1.5" role="group" aria-label="Party size">
              {[2, 3, 4, 6, 8].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setPartySize(sz)}
                  aria-pressed={partySize === sz}
                  style={{
                    ...inputStyle,
                    backgroundColor: partySize === sz ? theme.accentPink : theme.bgInput,
                    color: partySize === sz ? theme.onAccent : theme.heroText,
                  }}
                  className="w-9 h-9 rounded-lg text-xs font-bold border transition-all"
                >
                  {sz}p
                </button>
              ))}
            </div>

            <button
              onClick={() => setVipOnly(!vipOnly)}
              aria-pressed={vipOnly}
              style={{
                backgroundColor: vipOnly ? theme.accentGold : theme.bgInput,
                color: vipOnly ? theme.onAccent : theme.heroText,
                borderColor: theme.accentGold,
              }}
              className="px-4 py-2 rounded-lg text-xs tracking-wider uppercase border font-semibold transition-all"
            >
              {vipOnly ? `★ Showing VIPs Only (${vipCount})` : `♛ All ${restaurants.length} Spots (Filter VIPs)`}
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLivePlacesSearch();
            }}
            className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setLiveError(null);
              }}
              placeholder="Filter or search any Boston restaurant..."
              style={inputStyle}
              className="flex-1 px-3.5 py-2 rounded-lg text-xs border focus:outline-none"
            />
            {searchQuery.trim() && (
              <button
                type="submit"
                disabled={isSearchingLive}
                style={{ backgroundColor: theme.accentPink, color: theme.onAccent }}
                className="px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap disabled:opacity-60"
              >
                {isSearchingLive ? "Searching..." : "Search Google Live"}
              </button>
            )}
          </form>
        </div>

        {liveError && (
          <p style={{ color: theme.accentPink }} className="text-xs mt-3" role="alert">
            {liveError}
          </p>
        )}

        {/* Vibe Pills */}
        <div style={{ borderColor: `${theme.accentGold}33` }} className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          {VIBES.map((vibe) => (
            <button
              key={vibe}
              onClick={() => setSelectedVibe(vibe)}
              aria-pressed={selectedVibe === vibe}
              style={{
                backgroundColor: selectedVibe === vibe ? theme.accentPink : theme.bgInput,
                color: selectedVibe === vibe ? theme.onAccent : theme.heroText,
                borderColor: `${theme.accentGold}33`,
              }}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            >
              {vibe === "All Vibes" ? "✨ All Vibes" : vibe}
            </button>
          ))}
        </div>

        {/* Neighborhood Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span style={{ color: theme.heroMuted }} className="text-[10px] uppercase tracking-widest mr-1">
            Neighborhood:
          </span>
          {neighborhoods.map((hood) => (
            <button
              key={hood}
              onClick={() => setSelectedNeighborhood(hood)}
              aria-pressed={selectedNeighborhood === hood}
              style={{
                backgroundColor: selectedNeighborhood === hood ? theme.accentGold : "transparent",
                color: selectedNeighborhood === hood ? theme.onAccent : theme.heroText,
                borderColor: `${theme.accentGold}44`,
              }}
              className="px-2.5 py-1 rounded text-[11px] border transition-all"
            >
              {hood}
            </button>
          ))}
        </div>
      </div>

      {/* Add Custom Restaurant Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <form
            onSubmit={handleAddCustomSpot}
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: theme.bgCard, borderColor: theme.accentGold, color: theme.textPrimary }}
            className="w-full max-w-md border rounded-xl p-6 space-y-4"
          >
            <h2 className="text-xl font-serif">Add Restaurant to TableScout</h2>
            <input
              type="text"
              required
              autoFocus
              placeholder="Restaurant Name (e.g., Toro, Neptune Oyster)"
              value={newSpotName}
              onChange={(e) => setNewSpotName(e.target.value)}
              style={{ borderColor: `${theme.accentGold}55` }}
              className="w-full px-3 py-2 rounded bg-transparent border text-sm"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Neighborhood"
                value={newSpotNeighborhood}
                onChange={(e) => setNewSpotNeighborhood(e.target.value)}
                style={{ borderColor: `${theme.accentGold}55` }}
                className="flex-1 px-3 py-2 rounded bg-transparent border text-sm"
              />
              <select
                value={newSpotPlatform}
                onChange={(e) => setNewSpotPlatform(e.target.value as Platform)}
                style={{ borderColor: `${theme.accentGold}55`, backgroundColor: theme.bgCard, color: theme.textPrimary }}
                className="px-3 py-2 rounded border text-sm"
              >
                <option value="Resy">Resy</option>
                <option value="OpenTable">OpenTable</option>
                <option value="SevenRooms">SevenRooms</option>
                <option value="Tock">Tock</option>
                <option value="MajorDomo">MajorDomo</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ borderColor: `${theme.accentGold}55` }}
                className="px-4 py-2 text-xs rounded border"
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ backgroundColor: theme.accentPink, color: theme.onAccent }}
                className="px-4 py-2 text-xs font-bold rounded"
              >
                Save to Roster
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Restaurant Cards Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((r) => {
          const bookingUrl = getBookingUrl(r.platform, r.name, date, partySize);
          return (
            <div
              key={r.id}
              style={{
                backgroundColor: theme.bgCard,
                borderColor: r.isVip ? `${theme.accentGold}88` : `${theme.accentGold}33`,
              }}
              className="border rounded-xl p-6 shadow-xl flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div>
                    {r.isVip ? (
                      <span
                        style={{ backgroundColor: `${theme.accentGold}25`, color: theme.accentGold }}
                        className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded font-mono mr-2 font-semibold"
                      >
                        ♛ VIP FAVORITE
                      </span>
                    ) : (
                      <span
                        style={{ backgroundColor: `${theme.accentPink}25`, color: theme.accentPink }}
                        className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded font-mono mr-2"
                      >
                        {r.isLive ? "LIVE • GOOGLE" : "CURATED DISCOVERY"}
                      </span>
                    )}
                    <span
                      style={{ color: theme.textMuted, borderColor: `${theme.textMuted}33` }}
                      className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded font-mono border"
                    >
                      {r.neighborhood}
                    </span>
                    <h3 className="text-2xl font-serif mt-2">{r.name}</h3>
                    <p style={{ color: theme.textMuted }} className="text-xs">{r.cuisine}</p>
                  </div>

                  <button
                    onClick={() => toggleVip(r.id)}
                    title={r.isVip ? "Remove from VIP Favorites" : "Add to VIP Favorites"}
                    aria-label={r.isVip ? `Remove ${r.name} from VIP Favorites` : `Add ${r.name} to VIP Favorites`}
                    aria-pressed={r.isVip}
                    style={{ borderColor: `${theme.accentGold}55`, color: r.isVip ? theme.accentPink : theme.textMuted }}
                    className="shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-sm"
                  >
                    {r.isVip ? "♥" : "♡"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 my-3">
                  {r.vibes.map((v) => (
                    <span
                      key={v}
                      style={{ borderColor: `${theme.accentGold}33` }}
                      className="text-[11px] px-2.5 py-0.5 rounded-full border"
                    >
                      {v}
                    </span>
                  ))}
                </div>

                <div className="space-y-2 text-xs mt-4">
                  <p>
                    <span style={{ color: theme.accentGold }} className="uppercase tracking-widest text-[10px] mr-2">
                      Drop Rule
                    </span>
                    {r.platform} • {r.dropRule}
                  </p>
                  <p style={{ color: theme.textMuted }} className="italic leading-relaxed">“{r.insiderTip}”</p>
                  <div>
                    <span style={{ color: theme.accentGold }} className="uppercase tracking-widest text-[10px]">
                      Must Order
                    </span>
                    <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {r.mustOrder.map((d) => (
                        <li key={d}>• {d}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div style={{ borderColor: `${theme.accentGold}22` }} className="mt-5 pt-4 border-t">
                <div className="flex flex-wrap gap-2 mb-4">
                  {r.slots.map((s) => (
                    <a
                      key={s}
                      href={bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ borderColor: `${theme.accentPink}66`, color: theme.textPrimary }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border hover:opacity-80 transition-all"
                    >
                      {s}
                    </a>
                  ))}
                </div>
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ backgroundColor: theme.ctaFill, color: theme.ctaText }}
                  className="block w-full text-center py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90"
                >
                  Book on {r.platform} • {partySize}p • {date}
                </a>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ color: theme.textMuted }} className="col-span-full text-center py-16 text-sm">
            No spots match these filters. Type a name and hit “Search Google Live” to pull fresh results.
          </div>
        )}
      </div>
    </div>
  );
}
