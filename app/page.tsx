"use client";
import React, { useState } from "react";
import { getBookingUrl } from "@/lib/bookingResolver";

interface Restaurant {
  id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  isVip: boolean;
  vibes: string[];
  platform: "Resy" | "OpenTable" | "SevenRooms" | "Tock" | "MajorDomo";
  dropRule: string;
  insiderTip: string;
  mustOrder: string[];
  slots: string[];
}

const INITIAL_RESTAURANTS: Restaurant[] = [
  {
    id: "coppa",
    name: "Coppa",
    neighborhood: "South End",
    cuisine: "Italian Enoteria",
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
    cuisine: "Grand Italian",
    isVip: true,
    vibes: ["Glamorous & Dress Up", "Power Dinner & Luxe", "Date Night"],
    platform: "Resy",
    dropRule: "14 days out at 9:00 AM EST",
    insiderTip: "Request a booth in the main dining room for theatrical tableside presentations.",
    mustOrder: ["Carpaccio alla Cipriani", "Rigatoni alla Vodka", "Bistecca Fiorentina"],
    slots: ["5:30 PM", "7:00 PM", "9:00 PM"],
  },
  {
    id: "uni",
    name: "Uni",
    neighborhood: "Back Bay",
    cuisine: "Sashimi & Izakaya",
    isVip: true,
    vibes: ["High-Energy & Scene", "Date Night", "Power Dinner & Luxe"],
    platform: "Resy",
    dropRule: "30 days out at 10:00 AM EST",
    insiderTip: "Sit at the sushi bar to watch master knife work up close; order off-menu specials.",
    mustOrder: ["Corn Fried Rice", "Tuna Foie Gras", "Otoro Nigiri"],
    slots: ["6:15 PM", "8:00 PM", "9:30 PM"],
  },
  {
    id: "contessa",
    name: "Contessa",
    neighborhood: "Back Bay",
    cuisine: "Northern Italian",
    isVip: true,
    vibes: ["Glamorous & Dress Up", "Patio & People Watching", "Power Dinner & Luxe"],
    platform: "MajorDomo",
    dropRule: "30 days out at 9:00 AM EST",
    insiderTip: "The roof deck glass enclosure offers panoramic park views even in winter.",
    mustOrder: ["Spicy Lobster Bucatini", "Carpaccio", "Veal Milanese"],
    slots: ["5:00 PM", "7:15 PM", "8:45 PM"],
  },
  {
    id: "mooo",
    name: "Mooo....",
    neighborhood: "Beacon Hill",
    cuisine: "Steakhouse & Wine Bar",
    isVip: true,
    vibes: ["Cozy & Intimate", "Power Dinner & Luxe", "Date Night"],
    platform: "OpenTable",
    dropRule: "30 days out at 12:00 AM EST",
    insiderTip: "Located in a historic townhouse cellar; request a brick-arch booth.",
    mustOrder: ["A5 Wagyu Strip", "Truffle Butter", "Creamed Spinach"],
    slots: ["6:00 PM", "7:45 PM", "9:15 PM"],
  },
];

export default function TableScoutApp() {
  const [restaurants] = useState<Restaurant[]>(INITIAL_RESTAURANTS);
  const [selectedVibe, setSelectedVibe] = useState<string>("All Vibes");
  const [vipOnly, setVipOnly] = useState<boolean>(false);
  const [partySize, setPartySize] = useState<number>(2);
  const [date] = useState<string>("2026-11-07");

  const filtered = restaurants.filter((r) => {
    if (vipOnly && !r.isVip) return false;
    if (selectedVibe !== "All Vibes" && !r.vibes.includes(selectedVibe)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#09090B] text-[#DBDBDB] font-sans p-6">
      <header className="max-w-6xl mx-auto flex items-center justify-between pb-6 border-b border-[#C6B16C]/20 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl text-[#C6B16C]">♛</span>
            <h1 className="text-3xl font-serif tracking-wide text-white">TableScout</h1>
            <span className="px-3 py-1 bg-[#111115] border border-[#C6B16C]/40 text-[#C6B16C] text-xs uppercase tracking-widest rounded-full">
              Boston Reserve Edition
            </span>
          </div>
          <p className="text-xs text-[#DBDBDB]/60 mt-1">6 Pinned VIP Favorites • Vibe Concierge Active</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto bg-[#111115] border border-[#C6B16C]/30 rounded-xl p-4 mb-8 shadow-2xl">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={() => setVipOnly(!vipOnly)}
              className={`px-4 py-2 rounded-lg text-xs tracking-wider uppercase border transition-all ${
                vipOnly
                  ? "bg-[#C6B16C] text-black font-bold border-[#C6B16C]"
                  : "bg-[#1B1B1D] text-[#DBDBDB] border-[#C6B16C]/40 hover:border-[#C6B16C]"
              }`}
            >
              ★ VIP Favorites (6)
            </button>
          </div>
          <div className="flex gap-2">
            {[2, 3, 4, 6, 8].map((sz) => (
              <button
                key={sz}
                onClick={() => setPartySize(sz)}
                className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                  partySize === sz
                    ? "bg-[#F6C6D4] text-black"
                    : "bg-[#1B1B1D] text-[#DBDBDB] border border-[#C6B16C]/30 hover:border-[#C6B16C]"
                }`}
              >
                {sz}p
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#C6B16C]/20">
          {["All Vibes", "Glamorous & Dress Up", "Cozy & Intimate", "High-Energy & Scene", "Date Night", "Girls' Night & Cocktails", "Patio & People Watching", "Power Dinner & Luxe"].map((vibe) => (
            <button
              key={vibe}
              onClick={() => setSelectedVibe(vibe)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                selectedVibe === vibe
                  ? "bg-[#F6C6D4] text-black font-semibold"
                  : "bg-[#1B1B1D] text-[#DBDBDB]/80 border border-[#C6B16C]/20 hover:border-[#C6B16C]/60"
              }`}
            >
              {vibe === "All Vibes" ? "✨ All Vibes" : vibe}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((r) => {
          const bookingUrl = getBookingUrl(r.platform, r.name, date, partySize);
          return (
            <div key={r.id} className="bg-[#1B1B1D] border border-[#C6B16C]/40 rounded-xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-[#C6B16C]/20 text-[#C6B16C] rounded font-mono mr-2">
                      VIP FAVORITE
                    </span>
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-[#111115] text-[#DBDBDB]/70 rounded font-mono">
                      {r.neighborhood}
                    </span>
                    <h3 className="text-2xl font-serif text-white mt-2">{r.name}</h3>
                    <p className="text-xs text-[#DBDBDB]/60">{r.cuisine}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 my-3">
                  {r.vibes.map((v) => (
                    <span key={v} className="text-[11px] px-2.5 py-0.5 bg-[#111115] border border-[#C6B16C]/20 text-[#DBDBDB]/80 rounded-full">
                      {v}
                    </span>
                  ))}
                </div>

                <div className="bg-[#111115] border border-[#C6B16C]/30 rounded-lg p-3 my-4 space-y-2 text-xs">
                  <p className="text-[#F6C6D4]">
                    <strong>{r.platform}</strong> • Drop: {r.dropRule}
                  </p>
                  <p className="text-[#DBDBDB]/80">
                    <strong>Insider Tip:</strong> {r.insiderTip}
                  </p>
                  <p className="text-[#C6B16C]">
                    <strong>Must-Order:</strong> {r.mustOrder.join(", ")}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#C6B16C]/20">
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#F6C6D4] text-black text-center font-semibold text-xs py-2.5 rounded-lg hover:bg-white transition-colors"
                >
                  Book {r.platform} ({partySize}p) →
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
