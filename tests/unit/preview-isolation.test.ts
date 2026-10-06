import { afterEach, describe, expect, it, vi } from "vitest";
import { OrderEmailService } from "../../apps/api/src/order-emails/order-email.service";
import { previewReadOnlyGate } from "../../apps/api/src/preview-safety";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("isolated Railway preview", () => {
  it("does not schedule the production email dispatcher in preview", () => {
    vi.stubEnv("TIGER_PREVIEW_MODE", "true");
    vi.useFakeTimers();
    const service = new OrderEmailService();
    service.onModuleInit();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("preserves dispatcher scheduling outside preview", async () => {
    vi.stubEnv("TIGER_PREVIEW_MODE", "");
    vi.useFakeTimers();
    const service = new OrderEmailService();
    service.onModuleInit();
    expect(vi.getTimerCount()).toBe(1);
    await service.onModuleDestroy();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"])(
    "rejects %s before a payment/webhook/mutation handler",
    (method) => {
      const next = vi.fn();
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      previewReadOnlyGate({ method }, { setHeader: vi.fn(), status }, next);
      expect(status).toHaveBeenCalledWith(409);
      expect(next).not.toHaveBeenCalled();
    }
  );
});
