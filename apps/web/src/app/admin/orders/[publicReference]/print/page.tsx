import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getInternalOrder } from "../../../../../lib/internal-orders-api";
import OrderPrintDocument from "../../../../../components/staff-orders/OrderPrintDocument";
import PrintOrderButton from "../../../../../components/staff-orders/PrintOrderButton";
import styles from "../../../../../components/staff-orders/order-print.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Order summary | Tiger PingPong",
  robots: { index: false, follow: false }
};

export default async function PrintOrderPage({
  params
}: {
  params: Promise<{ publicReference: string }>;
}) {
  const { publicReference } = await params;
  let order;
  try {
    order = await getInternalOrder(publicReference);
  } catch {
    return (
      <main className={styles.preview}>
        <h1>Order could not be loaded</h1>
        <p>Try again before printing.</p>
        <Link href={`/admin/orders/${encodeURIComponent(publicReference)}`}>Back to order</Link>
      </main>
    );
  }
  if (!order) notFound();
  return (
    <main className={styles.preview} data-order-print>
      <div className={styles.toolbar}>
        <Link href={`/admin/orders/${encodeURIComponent(order.publicReference)}`}>
          Back to order
        </Link>
        <PrintOrderButton />
      </div>
      <OrderPrintDocument order={order} />
    </main>
  );
}
