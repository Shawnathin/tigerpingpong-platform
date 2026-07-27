import {
  CANADA_FREE_SHIPPING_THRESHOLD_CENTS,
  isAquaFourPackShippingItem,
  isPart40FullSetShippingItem,
  PART_40_FULL_SET_QUANTITY,
  type CanadaShippingItem
} from "@tigerpingpong/shared";

export const V1_FREE_SHIPPING_COPY = "Orders over $100 CAD ship free across Canada.";
export const V1_FLAT_RATE_SHIPPING_COPY =
  "Orders $100 CAD or under use $15 CAD flat-rate shipping.";
export const AQUA_FOUR_PACK_FREE_SHIPPING_COPY =
  "The Aqua 4-Pack w/ 3 Balls ships free across Canada.";
export const PART_40_FULL_SET_FREE_SHIPPING_COPY = `A full set of ${PART_40_FULL_SET_QUANTITY} Part 40 clips ships free across Canada.`;
export const V1_IN_STOCK_HANDLING_COPY = "In stock — ships within 24 business hours.";

export function getV1ShippingMessage(priceCents: number | null, item?: CanadaShippingItem): string {
  if (item && isPart40FullSetShippingItem(item)) {
    return PART_40_FULL_SET_FREE_SHIPPING_COPY;
  }

  if (item && isAquaFourPackShippingItem(item)) {
    return AQUA_FOUR_PACK_FREE_SHIPPING_COPY;
  }

  return priceCents !== null && priceCents > CANADA_FREE_SHIPPING_THRESHOLD_CENTS
    ? V1_FREE_SHIPPING_COPY
    : V1_FLAT_RATE_SHIPPING_COPY;
}
