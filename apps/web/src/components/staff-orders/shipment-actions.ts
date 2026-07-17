"use server";

import {
  updateInternalOrderShipment,
  type InternalOrderShipmentInput
} from "../../lib/internal-orders-api";

export async function updateShipmentFromForm(formData: FormData): Promise<{
  publicReference: string;
  saved: boolean;
}> {
  const publicReference = readRequiredFormString(formData, "publicReference");

  try {
    await updateInternalOrderShipment(publicReference, readShipmentInput(formData));
  } catch {
    return {
      publicReference,
      saved: false
    };
  }

  return {
    publicReference,
    saved: true
  };
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
