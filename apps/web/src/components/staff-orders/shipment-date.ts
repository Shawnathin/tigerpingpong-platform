const businessDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Vancouver",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

export function getVancouverDate(now: Date = new Date()): string {
  const parts = businessDateFormatter.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function getShipmentDate(stored: string | null, now: Date = new Date()): string {
  // The API stores the chosen calendar date at UTC midnight; it is not a shipment instant.
  if (stored) {
    const date = new Date(stored);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }
  return getVancouverDate(now);
}
