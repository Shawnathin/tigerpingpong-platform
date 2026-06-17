"use server";

import {
  InternalOrdersApiError,
  sendInternalOrderShipmentEmail,
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

export async function sendShipmentEmailFromForm(formData: FormData): Promise<{
  publicReference: string;
  status: "sent" | "blocked" | "config" | "failed";
}> {
  const publicReference = readRequiredFormString(formData, "publicReference");

  try {
    await sendInternalOrderShipmentEmail(publicReference);
  } catch (error) {
    if (error instanceof InternalOrdersApiError) {
      if (error.status === 400) {
        return {
          publicReference,
          status: "blocked"
        };
      }

      if (error.status === 503 && error.message.includes("webhook is not configured")) {
        return {
          publicReference,
          status: "config"
        };
      }
    }

    return {
      publicReference,
      status: "failed"
    };
  }

  return {
    publicReference,
    status: "sent"
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
