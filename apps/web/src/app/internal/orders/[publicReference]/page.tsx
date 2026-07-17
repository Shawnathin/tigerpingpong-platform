import type { Metadata } from "next";

import StaffOrderDetailPage from "../../../../components/staff-orders/StaffOrderDetailPage";

import { saveShipmentRecord } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Internal Order Detail | Tiger Ping Pong Platform",
  description: "Protected internal order detail."
};

interface InternalOrderDetailPageProps {
  params: Promise<{
    publicReference: string;
  }>;
  searchParams?: Promise<{
    shipmentError?: string | string[];
    shipmentSaved?: string | string[];
  }>;
}

export default async function InternalOrderDetailPage({
  params,
  searchParams
}: InternalOrderDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <StaffOrderDetailPage
      backHref="/internal/orders"
      eyebrow="Tiger Ping Pong internal"
      publicReference={resolvedParams.publicReference}
      saveShipmentRecord={saveShipmentRecord}
      searchParams={resolvedSearchParams}
    />
  );
}
