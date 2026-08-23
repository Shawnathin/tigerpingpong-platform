import type { Metadata } from "next";

import StaffOrderDetailPage from "../../../../components/staff-orders/StaffOrderDetailPage";

import { retryOrderEmail, saveShipmentRecord } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Internal Order Detail | Tiger PingPong Platform",
  description: "Protected internal order detail."
};

interface InternalOrderDetailPageProps {
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

export default async function InternalOrderDetailPage({
  params,
  searchParams
}: InternalOrderDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <StaffOrderDetailPage
      backHref="/internal/orders"
      eyebrow="Tiger PingPong internal"
      publicReference={resolvedParams.publicReference}
      retryOrderEmail={retryOrderEmail}
      saveShipmentRecord={saveShipmentRecord}
      searchParams={resolvedSearchParams}
    />
  );
}
