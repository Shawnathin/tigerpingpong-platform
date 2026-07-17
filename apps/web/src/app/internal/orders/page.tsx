import type { Metadata } from "next";

import StaffOrdersListPage from "../../../components/staff-orders/StaffOrdersListPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Internal Orders | Tiger Ping Pong Platform",
  description: "Protected internal paid order review."
};

interface InternalOrdersPageProps {
  searchParams?: Promise<{
    limit?: string | string[];
    status?: string | string[];
  }>;
}

export default async function InternalOrdersPage({ searchParams }: InternalOrdersPageProps) {
  return (
    <StaffOrdersListPage
      adminOrdersHref="/admin/orders"
      detailBasePath="/internal/orders"
      eyebrow="Tiger Ping Pong internal"
      intro="Protected internal order review remains available, but staff should use the admin orders route."
      searchParams={await searchParams}
      title="Paid order review"
    />
  );
}
