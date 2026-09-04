import type { Metadata } from "next";

import StaffOrderDetailPage from "../../../../components/staff-orders/StaffOrderDetailPage";

import { retryOrderEmail, saveShipmentRecord } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Order Detail | Tiger PingPong",
  description: "Protected Tiger PingPong staff order detail."
};

interface AdminOrderDetailPageProps {
  params: Promise<{
    publicReference: string;
  }>;
  searchParams?: Promise<{
    emailKind?: string | string[];
    emailStatus?: string | string[];
    shipmentError?: string | string[];
    shipmentEmail?: string | string[];
    shipmentSaved?: string | string[];
  }>;
}

export default async function AdminOrderDetailPage({
  params,
  searchParams
}: AdminOrderDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <StaffOrderDetailPage
      backHref="/admin/orders"
      eyebrow="Tiger PingPong admin"
      publicReference={resolvedParams.publicReference}
      retryOrderEmail={retryOrderEmail}
      saveShipmentRecord={saveShipmentRecord}
      searchParams={resolvedSearchParams}
    />
  );
}
