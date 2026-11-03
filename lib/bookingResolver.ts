export function getBookingUrl(
  platform: "Resy" | "OpenTable" | "SevenRooms" | "Tock" | "MajorDomo",
  restaurantName: string,
  date: string,
  partySize: number
): string {
  const encodedName = encodeURIComponent(restaurantName);
  switch (platform) {
    case "Resy":
      return `https://resy.com/cities/bos/venues/${restaurantName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    case "OpenTable":
      return `https://www.opentable.com/s?covers=${partySize}&dateTime=${date}T19:00:00&term=${encodedName}`;
    case "SevenRooms":
      return `https://www.sevenrooms.com/reservations/${restaurantName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    case "Tock":
      return `https://www.exploretock.com/${restaurantName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    default:
      return `https://www.google.com/search?q=${encodedName}+boston+reservation`;
  }
}
