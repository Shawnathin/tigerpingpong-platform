import { describe, expect, it } from "vitest";

import {
  buildResponsiveCloudinarySrcSet,
  buildResponsiveCloudinaryUrl
} from "../../apps/web/src/lib/product-media";

const source =
  "https://res.cloudinary.com/djfcisldm/image/upload/v1784269865/tigerpingpong/products/table.jpg";

describe("responsive product media", () => {
  it("adds non-upscaling Cloudinary transformations", () => {
    expect(buildResponsiveCloudinaryUrl(source, 1200)).toBe(
      "https://res.cloudinary.com/djfcisldm/image/upload/f_auto,q_auto,c_limit,w_1200/v1784269865/tigerpingpong/products/table.jpg"
    );
  });

  it("builds the approved responsive source widths", () => {
    const srcSet = buildResponsiveCloudinarySrcSet(source);

    expect(srcSet).toContain("c_limit,w_480");
    expect(srcSet).toContain(" 480w");
    expect(srcSet).toContain("c_limit,w_1600");
    expect(srcSet).toContain(" 1600w");
  });

  it("leaves non-Cloudinary sources unchanged", () => {
    const local = "/images/table.jpg";
    expect(buildResponsiveCloudinaryUrl(local, 1200)).toBe(local);
    expect(buildResponsiveCloudinarySrcSet(local)).toBeUndefined();
  });
});
