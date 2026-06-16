"use server";

import { redirect } from "next/navigation";

import {
  updateInternalOrderShipment,
  type InternalOrderShipmentInput
} from "../../../../lib/internal-orders-api";

export async function saveShipmentRecord(formData: FormData): Promise<void> {
  const publicReference = readRequiredFormString(formData, "publicReference");

  try {
    await updateInternalOrderShipment(publicReference, readShipmentInput(formData));
  } catch {
    redirect(`/internal/orders/${encodeURIComponent(publicReference)}?shipmentError=1`);
  }

  redirect(`/internal/orders/${encodeURIComponent(publicReference)}?shipmentSaved=1`);
}

function readShipmentInput(formData: FormData): InternalOrderShipmentInput {
  return {
    carrier: readRequiredFormString(formData, "carrier"),
    trackingNumber: readRequiredFormString(formData, "trackingNumber"),
    trackingUrl: readRequiredFormString(formData, "trackingUrl"),
    shippedDate: readRequiredFormString(formData, "shippedDate"),
    internalNote: readRequiredFormString(formData, "internalNote")
  };
}

function readRequiredFormString(formData: FormData, key: string): string {
  const value = formData.get(key);

  if (typeof value !== "string") {
    throw new Error(`${key} is required.`);
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${key} is required.`);
  }

  return normalized;
}
