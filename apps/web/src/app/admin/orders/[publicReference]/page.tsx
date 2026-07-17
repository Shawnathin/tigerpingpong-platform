import type { Metadata } from "next";

import StaffOrderDetailPage from "../../../../components/staff-orders/StaffOrderDetailPage";

import { saveShipmentRecord } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Order Detail | Tiger Ping Pong",
  description: "Protected Tiger Ping Pong staff order detail."
};

interface AdminOrderDetailPageProps {
  params: Promise<{
    publicReference: string;
  }>;
  searchParams?: Promise<{
    shipmentError?: string | string[];
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
      eyebrow="Tiger Ping Pong admin"
      publicReference={resolvedParams.publicReference}
      saveShipmentRecord={saveShipmentRecord}
      searchParams={resolvedSearchParams}
    />
  );
}
