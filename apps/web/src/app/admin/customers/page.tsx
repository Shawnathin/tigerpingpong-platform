import type { Metadata } from "next";

import {
  getAdminCustomers,
  type AdminCustomersResponse,
  type AdminCustomerSummary
} from "../../../lib/admin-api";
import { formatDateTime, formatMoney, formatNullable } from "../admin-format";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Customers | Tiger Ping Pong",
  description: "Protected read-only Tiger Ping Pong customer summaries derived from orders."
};

interface CustomersResource {
  data: AdminCustomersResponse | null;
}

async function loadCustomers(): Promise<CustomersResource> {
  try {
    return {
      data: await getAdminCustomers()
    };
  } catch {
    return {
      data: null
    };
  }
}

function renderCustomersTable(customers: AdminCustomerSummary[]) {
  if (customers.length === 0) {
    return <p className={styles.emptyText}>No customer summaries were returned.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Customer name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Order count</th>
            <th>Last order date</th>
            <th>Total spent</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.email}>
              <td>{formatNullable(customer.customerName)}</td>
              <td>{customer.email}</td>
              <td>{formatNullable(customer.customerPhone)}</td>
              <td>
                <div>{customer.orderCount}</div>
                <div className={styles.muted}>{customer.paidOrderCount} paid</div>
              </td>
              <td>{formatDateTime(customer.lastOrderDate)}</td>
              <td>{formatMoney(customer.totalSpentCents, customer.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminCustomersPage() {
  const resource = await loadCustomers();
  const customers = resource.data?.items ?? [];

  return (
    <div className={styles.pageStack}>
      <section className={styles.pageHeader} aria-labelledby="admin-customers-title">
        <h1 className={styles.title} id="admin-customers-title">
          Customers
        </h1>
      </section>

      <section className={styles.panel} aria-labelledby="admin-customers-list-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="admin-customers-list-title">Customers from orders</h2>
          </div>
        </div>

        {resource.data ? (
          renderCustomersTable(customers)
        ) : (
          <div className={styles.alert}>
            <p>Customers could not be loaded. Try again.</p>
          </div>
        )}
      </section>
    </div>
  );
}
