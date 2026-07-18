import type { Metadata } from "next";

import { getPathMetadata } from "../../../lib/seo";
import { PublicStorefrontFooter } from "../../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../../PublicStorefrontNav";
import { TableCategoryExperience } from "../TableCategoryExperience";

import styles from "../table-category.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getPathMetadata({
  pathname: "/tables/indoor-tables",
  title: "Indoor PingPong Tables | Tiger PingPong",
  description:
    "Shop Tiger indoor PingPong tables for basements, rec rooms, schools, community centres, and other dry spaces across Canada."
});

export default function IndoorTablesPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="tables" />
      <main className={styles.page}>
        <TableCategoryExperience kind="indoor" />
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
