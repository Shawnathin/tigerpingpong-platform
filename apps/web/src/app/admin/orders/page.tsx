import type { Metadata } from "next";

import StaffOrdersListPage from "../../../components/staff-orders/StaffOrdersListPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Orders | Tiger Ping Pong",
  description: "Protected Tiger Ping Pong staff order list."
};

interface AdminOrdersPageProps {
  searchParams?: Promise<{
    limit?: string | string[];
    status?: string | string[];
  }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  return (
    <StaffOrdersListPage
      detailBasePath="/admin/orders"
      eyebrow="Tiger Ping Pong admin"
      intro="Protected staff view for reviewing backend-confirmed Stripe orders and shipment records."
      searchParams={await searchParams}
      title="Paid order review"
    />
  );
}
