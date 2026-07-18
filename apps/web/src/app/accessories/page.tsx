import type { Metadata } from "next";

import { getPathMetadata } from "../../lib/seo";
import { GearCategoryExperience } from "../_gear/GearCategoryExperience";
import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";

import styles from "../_gear/gear-category.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getPathMetadata({
  pathname: "/accessories",
  title: "PingPong Accessories | Tiger PingPong",
  description:
    "Shop Tiger PingPong paddles, balls, covers, nets, and everyday gear with real help from Vancouver and shipping across Canada."
});

export default function AccessoriesPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="accessories" />
      <main className={styles.page}>
        <GearCategoryExperience kind="all" />
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
