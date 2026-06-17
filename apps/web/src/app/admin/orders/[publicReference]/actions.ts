"use server";

import { redirect } from "next/navigation";

import {
  sendShipmentEmailFromForm,
  updateShipmentFromForm
} from "../../../../components/staff-orders/shipment-actions";

export async function saveShipmentRecord(formData: FormData): Promise<void> {
  const result = await updateShipmentFromForm(formData);
  const statusParam = result.saved ? "shipmentSaved=1" : "shipmentError=1";

  redirect(`/admin/orders/${encodeURIComponent(result.publicReference)}?${statusParam}`);
}

export async function sendShipmentEmail(formData: FormData): Promise<void> {
  const result = await sendShipmentEmailFromForm(formData);
  const statusParam = `shipmentEmail=${encodeURIComponent(result.status)}`;

  redirect(`/admin/orders/${encodeURIComponent(result.publicReference)}?${statusParam}`);
}
