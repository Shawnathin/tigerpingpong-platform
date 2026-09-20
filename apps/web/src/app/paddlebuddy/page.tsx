import type { Metadata } from "next";

import { getPathMetadata } from "../../lib/seo";
import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import { PaddleBuddyExperience } from "./PaddleBuddyExperience";
import styles from "./page.module.css";

export const metadata: Metadata = getPathMetadata({
  pathname: "/paddlebuddy",
  title: "Paddle Buddy | A Tiger PingPong Side Project",
  description:
    "Paddle Buddy is an in-development Tiger PingPong side project for the Robo-Pong 3050XL."
});

export default function PaddleBuddyPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="paddlebuddy" />
      <main className={styles.page}>
        <PaddleBuddyExperience />
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
