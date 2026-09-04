"use server";

import {
  retryInternalOrderEmail,
  updateInternalOrderShipment,
  type InternalOrderEmailDelivery,
  type InternalOrderShipmentInput
} from "../../lib/internal-orders-api";

export async function updateShipmentFromForm(formData: FormData): Promise<{
  emailStatus: InternalOrderEmailDelivery["status"] | "unavailable";
  publicReference: string;
  saved: boolean;
}> {
  const publicReference = readRequiredFormString(formData, "publicReference");

  try {
    const result = await updateInternalOrderShipment(publicReference, readShipmentInput(formData));

    return {
      emailStatus: result.emailDelivery?.status ?? "unavailable",
      publicReference,
      saved: true
    };
  } catch {
    return {
      emailStatus: "unavailable",
      publicReference,
      saved: false
    };
  }
}

export async function retryOrderEmailFromForm(formData: FormData): Promise<{
  kind: InternalOrderEmailDelivery["kind"];
  publicReference: string;
  status: InternalOrderEmailDelivery["status"] | "unavailable";
}> {
  const publicReference = readRequiredFormString(formData, "publicReference");
  const kind = readEmailKind(formData);

  try {
    const delivery = await retryInternalOrderEmail(publicReference, kind);
    return { kind, publicReference, status: delivery.status };
  } catch {
    return { kind, publicReference, status: "unavailable" };
  }
}

function readShipmentInput(formData: FormData): InternalOrderShipmentInput {
  return {
    carrierCode: readCarrierCode(formData),
    customCarrier: readOptionalFormString(formData, "customCarrier") ?? undefined,
    trackingNumber: readRequiredFormString(formData, "trackingNumber"),
    trackingUrl: readOptionalFormString(formData, "trackingUrl") ?? undefined,
    shippedDate: readRequiredFormString(formData, "shippedDate"),
    internalNote: readRequiredFormString(formData, "internalNote")
  };
}

function readCarrierCode(formData: FormData): InternalOrderShipmentInput["carrierCode"] {
  const value = readRequiredFormString(formData, "carrierCode");
  const allowed: InternalOrderShipmentInput["carrierCode"][] = [
    "canada_post",
    "purolator",
    "ups",
    "fedex",
    "dhl_express",
    "other"
  ];

  if (!allowed.includes(value as InternalOrderShipmentInput["carrierCode"])) {
    throw new Error("carrierCode is invalid.");
  }

  return value as InternalOrderShipmentInput["carrierCode"];
}

function readEmailKind(formData: FormData): InternalOrderEmailDelivery["kind"] {
  const value = readRequiredFormString(formData, "kind");

  if (value !== "order_received" && value !== "shipment") {
    throw new Error("kind is invalid.");
  }

  return value;
}

function readOptionalFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
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
