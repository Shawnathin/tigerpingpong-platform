import type { Metadata } from "next";

import { getPathMetadata } from "../../../lib/seo";
import { GearCategoryExperience } from "../../_gear/GearCategoryExperience";
import { PublicStorefrontFooter } from "../../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../../PublicStorefrontNav";

import styles from "../../_gear/gear-category.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getPathMetadata({
  pathname: "/accessories/nets",
  title: "PingPong Nets & Post Sets | Tiger PingPong",
  description:
    "Shop Tiger PingPong nets and post sets with real fit help from Vancouver and shipping across Canada."
});

export default function NetsPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="accessories" />
      <main className={styles.page}>
        <GearCategoryExperience kind="nets" />
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
