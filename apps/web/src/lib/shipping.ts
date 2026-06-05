const FREE_SHIPPING_THRESHOLD_CENTS = 10000;

export function getV1ShippingMessage(priceCents: number | null): string {
  return priceCents !== null && priceCents > FREE_SHIPPING_THRESHOLD_CENTS
    ? "Free shipping across Canada."
    : "$15 flat rate shipping across Canada.";
}
