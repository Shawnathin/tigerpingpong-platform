export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function formatMoney(cents: number | null | undefined, currency = "CAD"): string {
  if (typeof cents !== "number" || !Number.isFinite(cents)) {
    return "Not set";
  }

  return new Intl.NumberFormat("en-CA", {
    currency,
    style: "currency"
  }).format(cents / 100);
}

export function formatNullable(value: string | null | undefined): string {
  return value?.trim() || "Not set";
}

export function formatStatus(value: string | null | undefined): string {
  if (!value?.trim()) {
    return "Not set";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatBoolean(value: boolean): string {
  return value ? "Yes" : "No";
}

export function formatCount(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat("en-CA").format(value);
}
