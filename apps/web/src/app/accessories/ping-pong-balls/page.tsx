import type { Metadata } from "next";

import { getPathMetadata } from "../../../lib/seo";
import { GearCategoryExperience } from "../../_gear/GearCategoryExperience";
import { PublicStorefrontFooter } from "../../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../../PublicStorefrontNav";

import styles from "../../_gear/gear-category.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getPathMetadata({
  pathname: "/accessories/ping-pong-balls",
  title: "PingPong Balls | Tiger PingPong",
  description:
    "Shop Tiger PingPong balls in six-packs and 140-packs for homes, schools, community centres, and shared spaces across Canada."
});

export default function PingPongBallsPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="balls" />
      <main className={styles.page}>
        <GearCategoryExperience kind="balls" />
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
