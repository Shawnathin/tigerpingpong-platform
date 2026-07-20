import { describe, expect, it } from "vitest";

import { getVisibleProductMediaItems } from "../../apps/web/src/lib/product-gallery";

const mediaItems = [
  { mediaKey: "01-main", variantKey: null },
  { mediaKey: "02-ocean", variantKey: "single-ocean" },
  { mediaKey: "03-canada-red", variantKey: "single-canada-red" },
  { mediaKey: "04-two-pack", variantKey: "two-pack" },
  { mediaKey: "05-four-pack", variantKey: "four-pack" },
  { mediaKey: "06-face", variantKey: null },
  { mediaKey: "07-grip", variantKey: null },
  { mediaKey: "08-package", variantKey: null }
];

describe("getVisibleProductMediaItems", () => {
  it("shows the complete curated gallery before an option is selected", () => {
    expect(getVisibleProductMediaItems(mediaItems, null).map(({ mediaKey }) => mediaKey)).toEqual([
      "01-main",
      "02-ocean",
      "03-canada-red",
      "04-two-pack",
      "05-four-pack",
      "06-face",
      "07-grip",
      "08-package"
    ]);
  });

  it.each([
    ["single-ocean", "02-ocean"],
    ["single-canada-red", "03-canada-red"],
    ["two-pack", "04-two-pack"],
    ["four-pack", "05-four-pack"]
  ])("puts the %s image first and hides other variants", (variantKey, expectedMediaKey) => {
    const visibleMedia = getVisibleProductMediaItems(mediaItems, variantKey);

    expect(visibleMedia.map(({ mediaKey }) => mediaKey)).toEqual([
      expectedMediaKey,
      "01-main",
      "06-face",
      "07-grip",
      "08-package"
    ]);
    expect(
      visibleMedia.filter((media) => media.variantKey).map(({ variantKey: key }) => key)
    ).toEqual([variantKey]);
  });

  it("falls back to shared media when a selected option has no image", () => {
    expect(
      getVisibleProductMediaItems(mediaItems, "missing-variant").map(({ mediaKey }) => mediaKey)
    ).toEqual(["01-main", "06-face", "07-grip", "08-package"]);
  });

  it("preserves legacy galleries that do not yet have shared media", () => {
    const legacyMedia = [
      { mediaKey: "one", variantKey: "one" },
      { mediaKey: "two", variantKey: "two" }
    ];

    expect(getVisibleProductMediaItems(legacyMedia, null)).toEqual(legacyMedia);
  });
});
