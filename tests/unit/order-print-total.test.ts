import { describe, expect, it } from "vitest";
import { getOrderPrintTotal } from "../../apps/web/src/components/staff-orders/order-print-total";

describe("printed order totals", () => {
  it("uses the confirmed total including tax for a paid order", () => {
    expect(
      getOrderPrintTotal({ status: "paid", totalCents: 2300, stripeAmountTotalCents: 2576 })
    ).toEqual({ label: "Total paid", cents: 2576, hasFinalTotal: true });
  });
  it.each(["pending", "failed", "expired", "refunded"])(
    "does not claim payment for %s orders",
    (status) => {
      expect(
        getOrderPrintTotal({ status, totalCents: 2300, stripeAmountTotalCents: 2576 }).label
      ).toBe("Order total");
    }
  );
  it("labels missing confirmed totals as pre-tax without inventing a tax amount", () => {
    expect(
      getOrderPrintTotal({ status: "paid", totalCents: 2300, stripeAmountTotalCents: null })
    ).toEqual({ label: "Order total before tax", cents: 2300, hasFinalTotal: false });
  });
  it("preserves a recorded zero total", () => {
    expect(
      getOrderPrintTotal({ status: "paid", totalCents: 2300, stripeAmountTotalCents: 0 }).cents
    ).toBe(0);
  });
});
