import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | Tiger Ping Pong",
  description: "Protected Tiger Ping Pong staff admin."
};

const ADMIN_NAV_ITEMS = [
  {
    href: "/admin",
    label: "Dashboard"
  },
  {
    href: "/admin/orders",
    label: "Orders"
  },
  {
    href: "/admin/products",
    label: "Products"
  },
  {
    href: "/admin/products/media",
    label: "Product Media"
  },
  {
    href: "/admin/customers",
    label: "Customers"
  },
  {
    href: "/admin/inventory",
    label: "Inventory"
  },
  {
    href: "/admin/settings",
    label: "Settings"
  },
  {
    href: "/admin/audit-log",
    label: "Audit Log"
  }
];

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar} aria-label="Tiger Ping Pong admin header">
        <div className={styles.brandRow}>
          <Link className={styles.brand} href="/admin">
            <span className={styles.brandMark} aria-hidden="true">
              TP
            </span>
            <span className={styles.brandText}>
              Tiger Ping Pong
              <span>Staff admin</span>
            </span>
          </Link>
          <span className={styles.readOnlyPill}>Protected V1</span>
        </div>

        <nav className={styles.nav} aria-label="Admin navigation">
          {ADMIN_NAV_ITEMS.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
