import type { InternalOrderDetail } from "../../lib/internal-orders-api";

// Order snapshots only; a recorded checkout amount alone does not establish payment.
export function getOrderPrintTotal(
  order: Pick<InternalOrderDetail, "status" | "stripeAmountTotalCents" | "totalCents">
) {
  if (order.stripeAmountTotalCents === null) {
    return { label: "Order total before tax", cents: order.totalCents, hasFinalTotal: false };
  }
  return {
    label: order.status === "paid" ? "Total paid" : "Order total",
    cents: order.stripeAmountTotalCents,
    hasFinalTotal: true
  };
}
