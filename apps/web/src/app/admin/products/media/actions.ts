"use server";

import { redirect } from "next/navigation";

import {
  addAdminProductMedia,
  unassignAdminProductMedia,
  updateAdminProductMedia,
  type AdminProductMediaInput
} from "../../../../lib/admin-api";

export async function addMediaMapping(formData: FormData): Promise<void> {
  const productId = readRequiredFormString(formData, "productId");

  await addAdminProductMedia(productId, readMediaInput(formData));
  redirect(`/admin/products/media?productId=${encodeURIComponent(productId)}`);
}

export async function updateMediaMapping(formData: FormData): Promise<void> {
  const productId = readRequiredFormString(formData, "productId");
  const mediaId = readRequiredFormString(formData, "mediaId");

  await updateAdminProductMedia(productId, mediaId, readMediaInput(formData));
  redirect(`/admin/products/media?productId=${encodeURIComponent(productId)}`);
}

export async function unassignMediaMapping(formData: FormData): Promise<void> {
  const productId = readRequiredFormString(formData, "productId");
  const mediaId = readRequiredFormString(formData, "mediaId");

  await unassignAdminProductMedia(productId, mediaId);
  redirect(`/admin/products/media?productId=${encodeURIComponent(productId)}`);
}

function readMediaInput(formData: FormData): AdminProductMediaInput {
  return {
    altText: readOptionalFormString(formData, "altText"),
    caption: readOptionalFormString(formData, "caption"),
    cloudinaryPublicId: readOptionalFormString(formData, "cloudinaryPublicId"),
    cloudinarySecureUrl: readOptionalFormString(formData, "cloudinarySecureUrl"),
    isPrimary: formData.get("isPrimary") === "on",
    role: readOptionalFormString(formData, "role") ?? "gallery",
    sortOrder: readFormInteger(formData, "sortOrder"),
    title: readOptionalFormString(formData, "title")
  };
}

function readRequiredFormString(formData: FormData, key: string): string {
  const value = readOptionalFormString(formData, key);

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

function readOptionalFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

function readFormInteger(formData: FormData, key: string): number {
  const value = readOptionalFormString(formData, key);
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw new Error(`${key} must be an integer.`);
  }

  return parsed;
}
