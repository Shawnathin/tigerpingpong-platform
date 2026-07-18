import type { Metadata } from "next";

import { getPathMetadata } from "../../../lib/seo";
import { PublicStorefrontFooter } from "../../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../../PublicStorefrontNav";
import { TableCategoryExperience } from "../TableCategoryExperience";

import styles from "../table-category.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getPathMetadata({
  pathname: "/tables/outdoor-tables",
  title: "Outdoor PingPong Tables | Tiger PingPong",
  description:
    "Shop durable Tiger outdoor PingPong tables for patios, backyards, schools, community centres, garages, and busy spaces across Canada."
});

export default function OutdoorTablesPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="tables" />
      <main className={styles.page}>
        <TableCategoryExperience kind="outdoor" />
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
