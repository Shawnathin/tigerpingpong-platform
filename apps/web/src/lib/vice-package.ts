import {
  VICE_BUNDLE_PUBLIC_LABEL,
  VICE_BUNDLE_OPTION_VALUE as SHARED_VICE_BUNDLE_OPTION_VALUE,
  VICE_BUNDLE_VARIANT_KEY as SHARED_VICE_BUNDLE_VARIANT_KEY,
  VICE_PACKAGE_OPTION_NAME as SHARED_VICE_PACKAGE_OPTION_NAME,
  VICE_PADDLE_PRODUCT_KEY,
  VICE_SINGLE_PUBLIC_LABEL,
  VICE_SINGLE_OPTION_VALUE as SHARED_VICE_SINGLE_OPTION_VALUE,
  VICE_SINGLE_VARIANT_KEY as SHARED_VICE_SINGLE_VARIANT_KEY
} from "@tigerpingpong/shared";

export const VICE_PRODUCT_SLUG = VICE_PADDLE_PRODUCT_KEY;
export const VICE_SINGLE_VARIANT_KEY = SHARED_VICE_SINGLE_VARIANT_KEY;
export const VICE_BUNDLE_VARIANT_KEY = SHARED_VICE_BUNDLE_VARIANT_KEY;
export const VICE_PACKAGE_OPTION_NAME = SHARED_VICE_PACKAGE_OPTION_NAME;
export const VICE_SINGLE_OPTION_VALUE = SHARED_VICE_SINGLE_OPTION_VALUE;
export const VICE_BUNDLE_OPTION_VALUE = SHARED_VICE_BUNDLE_OPTION_VALUE;
export const VICE_SINGLE_SHOPPER_LABEL = VICE_SINGLE_PUBLIC_LABEL;
export const VICE_BUNDLE_SHOPPER_LABEL = VICE_BUNDLE_PUBLIC_LABEL;

export type VicePackageVariantKey = typeof VICE_SINGLE_VARIANT_KEY | typeof VICE_BUNDLE_VARIANT_KEY;

export function getVicePackageShopperLabel(variantKey: string | null | undefined): string | null {
  if (variantKey === VICE_SINGLE_VARIANT_KEY) {
    return VICE_SINGLE_SHOPPER_LABEL;
  }

  if (variantKey === VICE_BUNDLE_VARIANT_KEY) {
    return VICE_BUNDLE_SHOPPER_LABEL;
  }

  return null;
}

export function getVicePackageVisualAltText(variantKey: string | null | undefined): string {
  return variantKey === VICE_BUNDLE_VARIANT_KEY
    ? "Vice package with four Tiger PingPong Vice paddles and six white balls."
    : "Single Tiger PingPong Vice paddle.";
}
