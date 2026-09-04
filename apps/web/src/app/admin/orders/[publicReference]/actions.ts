"use server";

import { redirect } from "next/navigation";

import {
  retryOrderEmailFromForm,
  updateShipmentFromForm
} from "../../../../components/staff-orders/shipment-actions";

export async function saveShipmentRecord(formData: FormData): Promise<void> {
  const result = await updateShipmentFromForm(formData);
  const statusParam = result.saved
    ? `shipmentSaved=1&shipmentEmail=${encodeURIComponent(result.emailStatus)}`
    : "shipmentError=1";

  redirect(`/admin/orders/${encodeURIComponent(result.publicReference)}?${statusParam}`);
}

export async function retryOrderEmail(formData: FormData): Promise<void> {
  const result = await retryOrderEmailFromForm(formData);
  redirect(
    `/admin/orders/${encodeURIComponent(result.publicReference)}?emailKind=${encodeURIComponent(result.kind)}&emailStatus=${encodeURIComponent(result.status)}`
  );
}
