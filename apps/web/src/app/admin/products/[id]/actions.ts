"use server";

import { redirect } from "next/navigation";

import { AdminApiError, updateAdminProduct } from "../../../../lib/admin-api";

export async function saveProduct(formData: FormData): Promise<void> {
  const productId = readRequiredString(formData, "productId");
  let status = "saved";

  try {
    const variantIds = formData
      .getAll("variantId")
      .map((value) => (typeof value === "string" ? value.trim() : ""));

    await updateAdminProduct(productId, {
      published: readChoice(formData, "published"),
      inStock: readChoice(formData, "inStock"),
      expectedUpdatedAt: readRequiredString(formData, "expectedUpdatedAt"),
      name: readRequiredString(formData, "name"),
      priceCents: parseMoneyInput(formData.get("price"), "Product price"),
      variants: variantIds.map((id) => ({
        id,
        isActive: formData.get(`variantActive:${id}`) === "on",
        priceCents: parseMoneyInput(formData.get(`variantPrice:${id}`), "Variant price")
      }))
    });
  } catch (error) {
    if (error instanceof AdminApiError) {
      status = error.status === 409 ? "stale" : error.status === 400 ? "validation" : "error";
    } else {
      status = "validation";
    }
  }

  redirect(`/admin/products/${encodeURIComponent(productId)}?status=${status}`);
}

function readRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${key} is required.`);
  }
  return value.trim();
}

function parseMoneyInput(value: FormDataEntryValue | null, label: string): number | null {
  if (typeof value !== "string") {
    throw new Error(`${label} is invalid.`);
  }
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`${label} must be a CAD amount with no more than two decimals.`);
  }
  const [dollars, cents = ""] = normalized.split(".");
  const valueCents = Number(dollars) * 100 + Number(cents.padEnd(2, "0"));
  if (!Number.isInteger(valueCents) || valueCents < 1 || valueCents > 99_999_999) {
    throw new Error(`${label} is outside the supported range.`);
  }
  return valueCents;
}

function readChoice(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  if (value !== "true" && value !== "false") throw new Error(`${key} is required.`);
  return value === "true";
}
