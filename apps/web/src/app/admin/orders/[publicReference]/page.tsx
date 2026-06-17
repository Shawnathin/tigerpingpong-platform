import type { Metadata } from "next";

import StaffOrderDetailPage from "../../../../components/staff-orders/StaffOrderDetailPage";

import { saveShipmentRecord, sendShipmentEmail } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Order Detail | Tiger Ping Pong",
  description: "Protected Tiger Ping Pong staff order detail."
};

interface AdminOrderDetailPageProps {
  params: {
    publicReference: string;
  };
  searchParams?: {
    shipmentError?: string | string[];
    shipmentSaved?: string | string[];
    shipmentEmail?: string | string[];
  };
}

export default function AdminOrderDetailPage({
  params,
  searchParams
}: AdminOrderDetailPageProps) {
  return (
    <StaffOrderDetailPage
      backHref="/admin/orders"
      eyebrow="Tiger Ping Pong admin"
      publicReference={params.publicReference}
      saveShipmentRecord={saveShipmentRecord}
      sendShipmentEmail={sendShipmentEmail}
      searchParams={searchParams}
    />
  );
}
