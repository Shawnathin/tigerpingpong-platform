const FREE_SHIPPING_THRESHOLD_CENTS = 10000;

export const V1_FREE_SHIPPING_COPY = "Orders over $100 CAD ship free across Canada.";
export const V1_FLAT_RATE_SHIPPING_COPY =
  "Orders $100 CAD or under use $15 CAD flat-rate shipping.";
export const V1_IN_STOCK_HANDLING_COPY =
  "Contact support to confirm current availability and handling timing before ordering.";

export function getV1ShippingMessage(priceCents: number | null): string {
  return priceCents !== null && priceCents > FREE_SHIPPING_THRESHOLD_CENTS
    ? V1_FREE_SHIPPING_COPY
    : V1_FLAT_RATE_SHIPPING_COPY;
}
