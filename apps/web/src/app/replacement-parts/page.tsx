import type { Metadata } from "next";

import { getPathMetadata } from "../../lib/seo";
import { GearCategoryExperience } from "../_gear/GearCategoryExperience";
import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";

import styles from "../_gear/gear-category.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getPathMetadata({
  pathname: "/replacement-parts",
  title: "Replacement Parts | Tiger PingPong",
  description:
    "Need a Tiger PingPong replacement part? Call or email a real person in Vancouver with your product name, photos, and order reference."
});

export default function ReplacementPartsPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="accessories" />
      <main className={styles.page}>
        <GearCategoryExperience kind="parts" />
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
