import type { Metadata } from "next";

import { getPathMetadata } from "../lib/seo";
import { HomepageExperience } from "./HomepageExperience";
import { PublicStorefrontFooter } from "./PublicStorefrontFooter";
import { PublicStorefrontNav } from "./PublicStorefrontNav";
import styles from "./page.module.css";

export const metadata: Metadata = getPathMetadata({
  pathname: "/",
  title: "Tiger PingPong | Tables, Paddles, Balls & Accessories",
  description:
    "Shop Tiger PingPong tables, paddles, balls, and outdoor gear from a Vancouver company serving players across Canada for more than 15 years."
});

export default function Home() {
  return (
    <>
      <PublicStorefrontNav activeItem="home" />
      <main className={styles.page}>
        <HomepageExperience />
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
