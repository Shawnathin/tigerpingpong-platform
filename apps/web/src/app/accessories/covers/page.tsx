import type { Metadata } from "next";

import { getPathMetadata } from "../../../lib/seo";
import { GearCategoryExperience } from "../../_gear/GearCategoryExperience";
import { PublicStorefrontFooter } from "../../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../../PublicStorefrontNav";

import styles from "../../_gear/gear-category.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getPathMetadata({
  pathname: "/accessories/covers",
  title: "PingPong Table Covers | Tiger PingPong",
  description:
    "Shop Tiger PingPong table covers built for Canadian weather, with real fit help from Vancouver."
});

export default function CoversPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="accessories" />
      <main className={styles.page}>
        <GearCategoryExperience kind="covers" />
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
