import { describe, expect, it } from "vitest";
import {
  getShipmentDate,
  getVancouverDate
} from "../../apps/web/src/components/staff-orders/shipment-date";

describe("Vancouver shipment dates", () => {
  it.each([
    ["2026-09-04T23:59:59Z", "2026-09-04"],
    ["2026-09-05T00:00:00Z", "2026-09-04"],
    ["2026-09-05T06:59:59Z", "2026-09-04"],
    ["2026-09-05T07:00:00Z", "2026-09-05"],
    ["2026-01-02T07:59:59Z", "2026-01-01"],
    ["2026-01-02T08:00:00Z", "2026-01-02"],
    ["2026-03-08T09:59:59Z", "2026-03-08"],
    ["2026-03-08T10:00:00Z", "2026-03-08"],
    ["2025-11-02T08:59:59Z", "2025-11-02"],
    ["2025-11-02T09:00:00Z", "2025-11-02"],
    ["2026-01-01T07:59:59Z", "2025-12-31"]
  ])("formats %s as %s regardless of server timezone", (instant, expected) => {
    expect(getVancouverDate(new Date(instant))).toBe(expected);
    expect(getShipmentDate(null, new Date(instant))).toBe(expected);
  });
  it("keeps the saved calendar date instead of shifting UTC midnight to the previous day", () => {
    expect(getShipmentDate("2026-09-04T00:00:00.000Z", new Date("2026-09-10T00:00:00Z"))).toBe(
      "2026-09-04"
    );
  });
  it("falls back to business today for an invalid stored date", () => {
    expect(getShipmentDate("invalid", new Date("2026-09-05T00:00:00Z"))).toBe("2026-09-04");
  });
});
