export type BookingPlatform = "Resy" | "OpenTable" | "SevenRooms" | "Tock" | "MajorDomo";

/** "Mooo...." -> "mooo", "Fox & the Knife" -> "fox-and-the-knife" */
export function slugify(name: string, separator = "-"): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, "") // drop parentheticals like "(Eva Newbury)"
    .replace(/&/g, " and ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents (Köfte -> Kofte)
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^\\${separator}+|\\${separator}+$`, "g"), "");
}

/**
 * Build a deep link to the restaurant's booking platform, pre-filled with
 * date (YYYY-MM-DD) and party size wherever the platform supports it.
 */
export function getBookingUrl(
  platform: BookingPlatform,
  restaurantName: string,
  date: string,
  partySize: number,
  time = "19:00"
): string {
  const q = encodeURIComponent(restaurantName);
  const size = Math.max(1, Math.min(20, Math.round(partySize) || 2));
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10);

  switch (platform) {
    case "Resy":
      return `https://resy.com/cities/bos/venues/${slugify(restaurantName)}?date=${safeDate}&seats=${size}`;
    case "OpenTable":
      return `https://www.opentable.com/s?covers=${size}&dateTime=${safeDate}T${encodeURIComponent(time)}&term=${q}&metroId=7`;
    case "SevenRooms":
      return `https://www.sevenrooms.com/reservations/${slugify(restaurantName, "")}?date=${safeDate}&party_size=${size}`;
    case "Tock":
      return `https://www.exploretock.com/${slugify(restaurantName)}/search?date=${safeDate}&size=${size}&time=${encodeURIComponent(time)}`;
    case "MajorDomo":
      return `https://www.google.com/search?q=${q}+boston+majordomo+reservation`;
    default:
      return `https://www.google.com/search?q=${q}+boston+reservation`;
  }
}
