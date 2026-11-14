"use client";
import React, { useEffect, useMemo, useState } from "react";
import { getBookingUrl, type Platform } from "@/lib/bookingResolver";

export interface Restaurant {
  id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  isVip: boolean;
  isNewOpening?: boolean;
  debutBadge?: string;
  vibes: string[];
  platform: Platform;
  dropRule: string;
  insiderTip: string;
  mustOrder: string[];
  slots: string[];
  websiteUri?: string;
}

export interface FeedbackEntry {
  restaurantId: string;
  restaurantName: string;
  rating: number;
  verdict: "Obsessed / VIP" | "Would Return" | "One & Done" | "Skip";
  favoriteDishes: string;
  bestTableNote: string;
  personalNotes: string;
  lastVisited: string;
}

interface ThemeTokens {
  id: string;
  label: string;
  bgCanvas: string;
  bgHero: string;
  bgCard: string;
  bgInput: string;
  bgPanel: string;
  textPrimary: string;
  textMuted: string;
  heroText: string;
  heroMuted: string;
  panelText: string;
  panelAccent: string;
  accentPink: string;
  accentGold: string;
  ctaFill: string;
  ctaText: string;
  onAccent: string;
}

const SAVED_THEMES: Record<string, ThemeTokens> = {
  obsidianDark: {
    id: "obsidianDark",
    label: "Obsidian Dark (Custom)",
    bgCanvas: "#09090B",
    bgHero: "#111115",
    bgCard: "#1B1B1D",
    bgInput: "#1B1B1D",
    bgPanel: "#111115",
    textPrimary: "#DBDBDB",
    textMuted: "#9CA3AF",
    heroText: "#DBDBDB",
    heroMuted: "#9CA3AF",
    panelText: "#DBDBDB",
    panelAccent: "#F6C6D4",
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
    bgHero: "#111115",
    bgCard: "#FFFFFF",
    bgInput: "#1B1B1D",
    bgPanel: "#FAF6F0",
    textPrimary: "#111115",
    textMuted: "#52525B",
    heroText: "#DBDBDB",
    heroMuted: "#9CA3AF",
    panelText: "#111115",
    panelAccent: "#B84A69",
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
    bgPanel: "#FAF6F0",
    textPrimary: "#0A0A0C",
    textMuted: "#57534E",
    heroText: "#0A0A0C",
    heroMuted: "#57534E",
    panelText: "#0A0A0C",
    panelAccent: "#B84A69",
    accentPink: "#F6C6D4",
    accentGold: "#C59B27",
    ctaFill: "#C59B27",
    ctaText: "#FFFFFF",
    onAccent: "#0A0A0C",
  },
};

// 1-Click Real-Time Scout Prompts
const QUICK_SCOUT_PROMPTS = [
  {
    id: "resy-hit-list",
    label: "✨ Just Added to Resy",
    query: "Brand new restaurants just opened in Boston on the Resy Hit List and Eater Boston Heatmap",
  },
  {
    id: "like-coppa",
    label: "🍝 New Spot Like Coppa",
    query: "New intimate neighborhood Italian pasta wine bar enoteca in Boston South End, North End, or Cambridge",
  },
  {
    id: "like-uni",
    label: "🍣 Crudo & Sashimi Like Uni",
    query: "New upscale sushi crudo sashimi izakaya or Nikkei restaurant in Boston or Cambridge",
  },
  {
    id: "back-bay-lounge",
    label: "🍸 Back Bay Cocktail Lounge",
    query: "New glamorous cocktail lounge martini bar late-night small plates in Back Bay or Newbury Street Boston",
  },
  {
    id: "cozy-date",
    label: "🕯️ Cozy South End Date Night",
    query: "New candlelit cozy intimate date night restaurant in Boston South End, Beacon Hill, or Brookline",
  },
  {
    id: "glam-supper",
    label: "🥩 Glamorous Supper Club",
    query: "New luxury steakhouse grand Italian or dress-up supper club in Boston Back Bay, Seaport, or Downtown",
  },
];

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

const VERDICTS: FeedbackEntry["verdict"][] = ["Obsessed / VIP", "Would Return", "One & Done", "Skip"];
const LS_FEEDBACK = "tablescout_feedback_v1";
const LS_DISMISSED = "tablescout_dismissed_v1";

function mergeNew(prev: Restaurant[], incoming: Restaurant[]): Restaurant[] {
  const existing = new Set(prev.map((r) => r.name.toLowerCase()));
  return incoming.filter((r) => !existing.has(r.name.toLowerCase()));
}

export default function TableScoutApp() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(INITIAL_RESTAURANTS);
  const [activeTab, setActiveTab] = useState<"concierge" | "newOpenings" | "myFeedback">("concierge");
  const [activeThemeKey, setActiveThemeKey] = useState<string>("obsidianDark");
  const [selectedVibe, setSelectedVibe] = useState<string>("All Vibes");
  const [vipOnly, setVipOnly] = useState<boolean>(false);
  const [partySize, setPartySize] = useState<number>(2);
  const [date, setDate] = useState<string>("2026-11-14");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isScoutingOpenings, setIsScoutingOpenings] = useState<boolean>(false);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [scoutBannerMessage, setScoutBannerMessage] = useState<string>("");
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Tasting Journal
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackEntry>>({});
  const [editingFeedbackFor, setEditingFeedbackFor] = useState<Restaurant | null>(null);
  const [draftRating, setDraftRating] = useState<number>(5);
  const [draftVerdict, setDraftVerdict] = useState<FeedbackEntry["verdict"]>("Obsessed / VIP");
  const [draftDishes, setDraftDishes] = useState<string>("");
  const [draftTableNote, setDraftTableNote] = useState<string>("");
  const [draftNotes, setDraftNotes] = useState<string>("");
  const [cloudSync, setCloudSync] = useState<"unknown" | "on" | "local">("unknown");

  // Weekly Digest
  const [digestEmail, setDigestEmail] = useState<string>("");
  const [digestStatus, setDigestStatus] = useState<string>("");
  const [isSendingDigest, setIsSendingDigest] = useState<boolean>(false);

  const theme = SAVED_THEMES[activeThemeKey];

  // Startup: local feedback + dismissed, live openings feed, cloud feedback sync
  useEffect(() => {
    try {
      const local = localStorage.getItem(LS_FEEDBACK);
      if (local) setFeedbackMap(JSON.parse(local));
      const dismissed = localStorage.getItem(LS_DISMISSED);
      if (dismissed) setDismissedIds(JSON.parse(dismissed));
    } catch {
      /* corrupted storage — ignore */
    }

    fetch("/api/openings")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.openings)) {
          setRestaurants((prev) => [...prev, ...mergeNew(prev, data.openings)]);
        }
      })
      .catch(() => {});

    fetch("/api/feedback")
      .then((r) => r.json())
      .then((data) => {
        setCloudSync(data.configured ? "on" : "local");
        if (!Array.isArray(data.feedback)) return;
        const synced: Record<string, FeedbackEntry> = {};
        data.feedback.forEach((row: Record<string, unknown>) => {
          const id = String(row.restaurant_id);
          synced[id] = {
            restaurantId: id,
            restaurantName: String(row.restaurant_name ?? ""),
            rating: Number(row.rating),
            verdict: row.verdict as FeedbackEntry["verdict"],
            favoriteDishes: String(row.favorite_dishes ?? ""),
            bestTableNote: String(row.best_table_note ?? ""),
            personalNotes: String(row.personal_notes ?? ""),
            lastVisited: String(row.last_visited ?? ""),
          };
        });
        setFeedbackMap((prev) => ({ ...prev, ...synced }));
        // Cloud "Obsessed" verdicts re-pin as VIP
        setRestaurants((prev) =>
          prev.map((r) => (synced[r.id]?.verdict === "Obsessed / VIP" ? { ...r, isVip: true } : r))
        );
      })
      .catch(() => setCloudSync("local"));
  }, []);

  // Unified real-time scout (mood pills, header button, custom search box)
  const triggerRealTimeScout = async (customPrompt?: string, pillId?: string) => {
    if (isScoutingOpenings) return;
    const typed = searchQuery.trim();
    const queryToUse =
      customPrompt?.trim() ||
      (typed
        ? `${typed} restaurant Boston`
        : "Brand new upscale restaurant or cocktail bar recently opened in Boston Back Bay, South End, or Cambridge");

    setIsScoutingOpenings(true);
    setActivePromptId(pillId || "custom");
    setScoutBannerMessage("Scouting live Boston recommendations…");

    try {
      const res = await fetch("/api/openings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryToUse }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.openings)) {
        setScoutBannerMessage(`Scout failed: ${data.error || `HTTP ${res.status}`}`);
        return;
      }
      const incoming: Restaurant[] = data.openings;
      const fresh = mergeNew(restaurants, incoming);
      setRestaurants((prev) => [...mergeNew(prev, incoming), ...prev]);
      // Un-dismiss anything the user explicitly scouted again
      setDismissedIds((prev) => prev.filter((id) => !incoming.some((i) => i.id === id)));
      setActiveTab("newOpenings");
      setVipOnly(false);
      setSelectedVibe("All Vibes");
      setSearchQuery("");
      setScoutBannerMessage(
        fresh.length > 0
          ? `✓ Added ${fresh.length} fresh recommendation${fresh.length === 1 ? "" : "s"} to New Openings`
          : incoming.length > 0
          ? `✓ ${incoming.length} matches — already on your list`
          : "No matches found. Try a different craving."
      );
    } catch {
      setScoutBannerMessage("Could not reach /api/openings.");
    } finally {
      setIsScoutingOpenings(false);
      setActivePromptId(null);
    }
  };

  const toggleVip = (id: string) => {
    setRestaurants((prev) => prev.map((r) => (r.id === id ? { ...r, isVip: !r.isVip } : r)));
  };

  const dismissOpening = (id: string) => {
    setDismissedIds((prev) => {
      const next = [...prev, id];
      localStorage.setItem(LS_DISMISSED, JSON.stringify(next));
      return next;
    });
  };

  const openFeedbackDrawer = (r: Restaurant) => {
    const existing = feedbackMap[r.id];
    setEditingFeedbackFor(r);
    setDraftRating(existing?.rating ?? 5);
    setDraftVerdict(existing?.verdict ?? (r.isVip ? "Obsessed / VIP" : "Would Return"));
    setDraftDishes(existing?.favoriteDishes ?? r.mustOrder.join(", "));
    setDraftTableNote(existing?.bestTableNote ?? "");
    setDraftNotes(existing?.personalNotes ?? "");
  };

  const saveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeedbackFor) return;
    const target = editingFeedbackFor;

    const entry: FeedbackEntry = {
      restaurantId: target.id,
      restaurantName: target.name,
      rating: draftRating,
      verdict: draftVerdict,
      favoriteDishes: draftDishes,
      bestTableNote: draftTableNote,
      personalNotes: draftNotes,
      lastVisited: new Date().toISOString().split("T")[0],
    };

    setFeedbackMap((prev) => {
      const updated = { ...prev, [target.id]: entry };
      localStorage.setItem(LS_FEEDBACK, JSON.stringify(updated));
      return updated;
    });

    if (draftVerdict === "Obsessed / VIP") {
      setRestaurants((prev) => prev.map((item) => (item.id === target.id ? { ...item, isVip: true } : item)));
    }

    setEditingFeedbackFor(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      const data = await res.json();
      setCloudSync(data.configured ? "on" : "local");
    } catch {
      setCloudSync("local");
    }
  };

  const triggerWeeklyDigestEmail = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(digestEmail.trim())) {
      setDigestStatus("Enter a valid email first.");
      return;
    }
    setIsSendingDigest(true);
    setDigestStatus("Sending weekly new openings digest…");
    try {
      const res = await fetch("/api/digest/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: digestEmail.trim() }),
      });
      const data = await res.json();
      if (data.simulated) {
        setDigestStatus(`Preview generated (${data.count} spots). Add RESEND_API_KEY in Vercel for inbox delivery.`);
      } else if (data.success) {
        setDigestStatus("✓ Weekly New Openings digest sent to your inbox!");
      } else {
        setDigestStatus(`Alert: ${data.error || "Check Resend configuration"}`);
      }
    } catch {
      setDigestStatus("Could not reach /api/digest/weekly.");
    } finally {
      setIsSendingDigest(false);
    }
  };

  const visibleRestaurants = useMemo(
    () => restaurants.filter((r) => !dismissedIds.includes(r.id)),
    [restaurants, dismissedIds]
  );
  const newOpeningsRoster = visibleRestaurants.filter((r) => r.isNewOpening);

  const filtered = visibleRestaurants
    .filter((r) => {
      if (activeTab === "newOpenings" && !r.isNewOpening) return false;
      if (activeTab === "myFeedback" && !feedbackMap[r.id]) return false;
      if (vipOnly && !r.isVip) return false;
      if (selectedVibe !== "All Vibes" && !r.vibes.includes(selectedVibe)) return false;
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

  const loggedCount = Object.keys(feedbackMap).length;
  const vipCount = visibleRestaurants.filter((r) => r.isVip).length;

  const inputStyle: React.CSSProperties = {
    backgroundColor: theme.bgInput,
    borderColor: `${theme.accentGold}55`,
    color: theme.heroText,
  };
  const fieldStyle: React.CSSProperties = {
    backgroundColor: "transparent",
    borderColor: `${theme.accentGold}66`,
    color: theme.textPrimary,
  };

  const emptyMessage =
    activeTab === "myFeedback"
      ? "No visits logged yet. Tap ✎ Log on any card after you dine."
      : activeTab === "newOpenings"
      ? "No live recommendations yet. Tap a craving above to scout."
      : "No spots match these filters.";

  return (
    <div
      style={{ backgroundColor: theme.bgCanvas, color: theme.textPrimary }}
      className="min-h-screen font-sans p-6 transition-colors duration-300"
    >
      {/* Header */}
      <header
        style={{ borderColor: `${theme.accentGold}33` }}
        className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b mb-6"
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
            {vipCount} Pinned VIPs • {newOpeningsRoster.length} Live Recommendations • {loggedCount} Visits Logged
            {cloudSync === "on" && " • ☁ Synced"}
            {cloudSync === "local" && " • Saved on this device"}
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {(
            [
              ["concierge", `♛ All Spots (${visibleRestaurants.length})`, theme.accentGold],
              ["newOpenings", `✨ New Openings For You (${newOpeningsRoster.length})`, theme.accentPink],
              ["myFeedback", `✎ My Tasting Log (${loggedCount})`, theme.accentPink],
            ] as const
          ).map(([key, label, activeColor]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              aria-pressed={activeTab === key}
              style={{
                backgroundColor: activeTab === key ? activeColor : theme.bgCard,
                color: activeTab === key ? theme.onAccent : theme.textPrimary,
                borderColor: `${activeColor}88`,
              }}
              className="px-3.5 py-2 rounded-full text-xs font-bold border transition-all"
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => triggerRealTimeScout(undefined, "header")}
            disabled={isScoutingOpenings}
            style={{ backgroundColor: theme.accentPink, color: theme.onAccent }}
            className="px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:opacity-90 transition-all disabled:opacity-60"
          >
            {isScoutingOpenings && activePromptId === "header" ? "Scouting Live…" : "⚡ Scout Fresh Openings Now"}
          </button>
        </nav>
      </header>

      {/* Theme Switcher & Weekly Digest */}
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span style={{ color: theme.textMuted }} className="text-[11px] uppercase tracking-widest mr-1">
            Palette:
          </span>
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
              className="px-3 py-1 rounded-full text-xs border transition-all"
            >
              {t.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            triggerWeeklyDigestEmail();
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            type="email"
            value={digestEmail}
            onChange={(e) => setDigestEmail(e.target.value)}
            placeholder="Your email for Thursday Openings Digest..."
            style={{ backgroundColor: theme.bgCard, borderColor: `${theme.accentGold}55`, color: theme.textPrimary }}
            className="px-3 py-1.5 rounded-lg text-xs border min-w-[230px]"
          />
          <button
            type="submit"
            disabled={isSendingDigest}
            style={{ backgroundColor: theme.accentGold, color: theme.onAccent }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold disabled:opacity-60"
          >
            ✉ Email Me This Week&apos;s Openings
          </button>
          {digestStatus && (
            <span style={{ color: theme.textMuted }} className="text-xs font-medium w-full text-right">
              {digestStatus}
            </span>
          )}
        </form>
      </div>

      {/* 1-Click Mood Scout Bar */}
      <div
        style={{ backgroundColor: theme.bgHero, borderColor: `${theme.accentPink}66`, color: theme.heroText }}
        className="max-w-6xl mx-auto border rounded-xl p-4 mb-6 shadow-xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <span
            style={{ color: theme.accentPink }}
            className="text-[11px] font-mono uppercase tracking-widest font-semibold"
          >
            ⚡ 1-Click Live Scout • Tap a Craving to Pull Real-Time Boston Recommendations
          </span>
          {scoutBannerMessage && (
            <span style={{ color: theme.accentGold }} className="text-xs font-medium" role="status">
              {scoutBannerMessage}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_SCOUT_PROMPTS.map((preset) => {
            const isRunningThis = isScoutingOpenings && activePromptId === preset.id;
            return (
              <button
                key={preset.id}
                disabled={isScoutingOpenings}
                onClick={() => triggerRealTimeScout(preset.query, preset.id)}
                style={{
                  backgroundColor: isRunningThis ? theme.accentPink : theme.bgInput,
                  color: isRunningThis ? theme.onAccent : theme.heroText,
                  borderColor: isRunningThis ? theme.accentPink : `${theme.accentGold}55`,
                }}
                className="px-3.5 py-2 rounded-lg text-xs font-medium border hover:opacity-80 transition-all disabled:cursor-wait"
              >
                {isRunningThis ? `Scouting ${preset.label}…` : preset.label}
              </button>
            );
          })}
        </div>
      </div>

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
                  className="w-9 h-9 rounded-lg text-xs font-bold border"
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
              className="px-4 py-2 rounded-lg text-xs tracking-wider uppercase border font-semibold"
            >
              {vipOnly ? `★ Showing VIPs Only (${vipCount})` : "♛ Filter VIPs Only"}
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) triggerRealTimeScout(undefined, "search-box");
            }}
            className="flex items-center gap-2 flex-1 min-w-[250px] max-w-md"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter, or type any craving and hit Scout Live…"
              style={inputStyle}
              className="flex-1 px-3.5 py-2 rounded-lg text-xs border focus:outline-none"
            />
            <button
              type="submit"
              disabled={isScoutingOpenings || !searchQuery.trim()}
              style={{ backgroundColor: theme.accentPink, color: theme.onAccent }}
              className="px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap disabled:opacity-50"
            >
              {isScoutingOpenings && activePromptId === "search-box" ? "Scouting…" : "+ Scout Live"}
            </button>
          </form>
        </div>

        <div style={{ borderColor: `${theme.accentGold}33` }} className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          {VIBES.map((vibe) => (
            <button
              key={vibe}
              onClick={() => setSelectedVibe(vibe)}
              aria-pressed={selectedVibe === vibe}
              style={{
                backgroundColor: selectedVibe === vibe ? theme.accentPink : theme.bgInput,
                color: selectedVibe === vibe ? theme.onAccent : theme.heroText,
                borderColor: `${theme.accentGold}40`,
              }}
              className="px-3 py-1.5 rounded-full text-xs font-medium border"
            >
              {vibe === "All Vibes" ? "✨ All Vibes" : vibe}
            </button>
          ))}
        </div>
      </div>

      {/* Tasting Journal Modal */}
      {editingFeedbackFor && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setEditingFeedbackFor(null)}
        >
          <form
            onSubmit={saveFeedback}
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: theme.bgCard, borderColor: theme.accentGold, color: theme.textPrimary }}
            className="w-full max-w-lg border rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div style={{ borderColor: `${theme.accentGold}4D` }} className="flex justify-between items-center border-b pb-3">
              <div>
                <span style={{ color: theme.accentGold }} className="text-[10px] font-mono uppercase tracking-widest">
                  Personal Tasting & Seat Log
                </span>
                <h2 className="text-2xl font-serif">{editingFeedbackFor.name}</h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setEditingFeedbackFor(null)}
                className="text-sm opacity-70"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
                <span className="text-xs mr-1">Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    role="radio"
                    aria-checked={draftRating === star}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    onClick={() => setDraftRating(star)}
                    style={{ color: star <= draftRating ? theme.accentGold : `${theme.textMuted}66` }}
                    className="text-xl"
                  >
                    ★
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {VERDICTS.map((v) => (
                  <button
                    type="button"
                    key={v}
                    aria-pressed={draftVerdict === v}
                    onClick={() => setDraftVerdict(v)}
                    style={{
                      backgroundColor: draftVerdict === v ? theme.accentPink : "transparent",
                      color: draftVerdict === v ? theme.onAccent : theme.textPrimary,
                      borderColor: `${theme.accentGold}55`,
                    }}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="block mb-1 opacity-80">Favorite Dishes & Cocktails Ordered</span>
                <input
                  type="text"
                  value={draftDishes}
                  onChange={(e) => setDraftDishes(e.target.value)}
                  maxLength={1000}
                  style={fieldStyle}
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </label>
              <label className="block">
                <span className="block mb-1 opacity-80">Best Seat / Table Note for Next Time</span>
                <input
                  type="text"
                  value={draftTableNote}
                  onChange={(e) => setDraftTableNote(e.target.value)}
                  maxLength={500}
                  placeholder="e.g., Corner marble bar seats or Booth 12"
                  style={fieldStyle}
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </label>
              <label className="block">
                <span className="block mb-1 opacity-80">Personal Vibe & Service Feedback</span>
                <textarea
                  rows={3}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  maxLength={4000}
                  placeholder="How was the crowd, lighting, pacing, or cocktail program?"
                  style={fieldStyle}
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </label>
            </div>

            <div style={{ borderColor: `${theme.accentGold}4D` }} className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setEditingFeedbackFor(null)}
                style={{ borderColor: `${theme.textMuted}88` }}
                className="px-4 py-2 rounded-lg text-xs border"
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ backgroundColor: theme.accentPink, color: theme.onAccent }}
                className="px-5 py-2 rounded-lg text-xs font-bold"
              >
                Save Feedback to Log
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((r) => {
          const bookingUrl = getBookingUrl(r.platform, r.name, date, partySize);
          const myLog = feedbackMap[r.id];

          return (
            <div
              key={r.id}
              style={{
                backgroundColor: theme.bgCard,
                borderColor: r.isVip ? `${theme.accentGold}88` : `${theme.accentPink}44`,
              }}
              className="border rounded-xl p-6 shadow-xl flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {r.isVip && (
                        <span
                          style={{ backgroundColor: `${theme.accentGold}25`, color: theme.accentGold }}
                          className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded font-mono font-semibold"
                        >
                          ♛ VIP FAVORITE
                        </span>
                      )}
                      {r.isNewOpening && (
                        <span
                          style={{ backgroundColor: `${theme.accentPink}30`, color: theme.panelAccent }}
                          className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded font-mono font-semibold"
                        >
                          ✨ {r.debutBadge || "NEW OPENING"}
                        </span>
                      )}
                      <span
                        style={{ color: theme.textMuted, borderColor: `${theme.textMuted}33` }}
                        className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded font-mono border"
                      >
                        {r.neighborhood}
                      </span>
                    </div>
                    <h3 className="text-2xl font-serif mt-1">{r.name}</h3>
                    <p style={{ color: theme.textMuted }} className="text-xs">{r.cuisine}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleVip(r.id)}
                      title={r.isVip ? "Remove from VIP Favorites" : "Add to VIP Favorites"}
                      aria-label={r.isVip ? `Remove ${r.name} from VIP` : `Add ${r.name} to VIP`}
                      aria-pressed={r.isVip}
                      style={{ borderColor: `${theme.accentGold}55`, color: r.isVip ? theme.accentPink : theme.textMuted }}
                      className="w-8 h-8 rounded-full border flex items-center justify-center text-sm"
                    >
                      {r.isVip ? "♥" : "♡"}
                    </button>
                    <button
                      onClick={() => openFeedbackDrawer(r)}
                      style={{
                        borderColor: myLog ? theme.accentPink : `${theme.accentGold}55`,
                        backgroundColor: myLog ? `${theme.accentPink}20` : "transparent",
                        color: theme.textPrimary,
                      }}
                      className="px-3 py-1.5 rounded-full border text-xs font-medium"
                    >
                      ✎ {myLog ? `${myLog.rating}★` : "Log"}
                    </button>
                    {r.isNewOpening && !r.isVip && (
                      <button
                        onClick={() => dismissOpening(r.id)}
                        title="Dismiss recommendation"
                        aria-label={`Dismiss ${r.name}`}
                        className="text-xs opacity-50 hover:opacity-100 px-1.5"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 my-3">
                  {r.vibes.map((v) => (
                    <span
                      key={v}
                      style={{ borderColor: `${theme.accentGold}33` }}
                      className="text-[11px] px-2.5 py-0.5 border rounded-full opacity-85"
                    >
                      {v}
                    </span>
                  ))}
                </div>

                {myLog && (
                  <div
                    style={{ backgroundColor: `${theme.accentPink}15`, borderColor: theme.accentPink }}
                    className="border rounded-lg p-3 my-3 text-xs space-y-1"
                  >
                    <div className="flex justify-between font-semibold gap-2" style={{ color: theme.panelAccent }}>
                      <span>My Verdict: {myLog.verdict} ({"★".repeat(myLog.rating)})</span>
                      <span className="opacity-70">{myLog.lastVisited}</span>
                    </div>
                    {myLog.bestTableNote && <p><strong>Seat Note:</strong> {myLog.bestTableNote}</p>}
                    {myLog.favoriteDishes && <p><strong>Loved:</strong> {myLog.favoriteDishes}</p>}
                    {myLog.personalNotes && <p className="italic opacity-90">“{myLog.personalNotes}”</p>}
                  </div>
                )}

                <div
                  style={{ backgroundColor: theme.bgPanel, borderColor: `${theme.accentGold}40`, color: theme.panelText }}
                  className="border rounded-lg p-3.5 my-4 space-y-2 text-xs"
                >
                  <p style={{ color: theme.panelAccent }}>
                    <strong>{r.platform}</strong> • Drop: {r.dropRule}
                  </p>
                  <p className="opacity-90">
                    <strong>{r.isNewOpening ? "Why It's On Your Radar:" : "Insider Tip:"}</strong> {r.insiderTip}
                  </p>
                  <p style={{ color: theme.accentGold }} className="font-medium">
                    <strong>Must-Order:</strong> {r.mustOrder.join(", ")}
                  </p>
                  {r.websiteUri && (
                    <a
                      href={r.websiteUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: theme.panelAccent }}
                      className="underline"
                    >
                      Website ↗
                    </a>
                  )}
                </div>
              </div>

              <div
                style={{ borderColor: `${theme.accentGold}33` }}
                className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t"
              >
                <div className="flex gap-1.5 flex-wrap">
                  {r.slots.map((slot) => (
                    <a
                      key={slot}
                      href={bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ borderColor: `${theme.accentGold}44` }}
                      className="px-2.5 py-1.5 rounded text-[11px] border hover:opacity-80"
                    >
                      {slot}
                    </a>
                  ))}
                </div>

                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ backgroundColor: theme.ctaFill, color: theme.ctaText }}
                  className="px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap hover:opacity-90"
                >
                  Book {r.platform} ({partySize}p) ↗
                </a>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ color: theme.textMuted }} className="col-span-full text-center py-16 text-sm">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
