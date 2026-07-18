import type { Metadata } from "next";

import { getPathMetadata } from "../../../lib/seo";
import { GearCategoryExperience } from "../../_gear/GearCategoryExperience";
import { PublicStorefrontFooter } from "../../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../../PublicStorefrontNav";

import styles from "../../_gear/gear-category.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getPathMetadata({
  pathname: "/accessories/paddles",
  title: "PingPong Paddles | Tiger PingPong",
  description:
    "Shop Tiger PingPong paddles for patios, schools, rec rooms, young players, and everyday rallies across Canada."
});

export default function PaddlesPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="paddles" />
      <main className={styles.page}>
        <GearCategoryExperience kind="paddles" />
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
