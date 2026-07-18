import type { Metadata } from "next";

import { getPathMetadata } from "../../lib/seo";
import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import { TablesExperience } from "./TablesExperience";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getPathMetadata({
  pathname: "/tables",
  title: "PingPong Tables | Tiger PingPong",
  description:
    "Shop indoor and outdoor Tiger PingPong tables for homes, patios, schools, community centres, and shared spaces across Canada."
});

export default function TablesPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="tables" />
      <main className={styles.page}>
        <TablesExperience />
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
