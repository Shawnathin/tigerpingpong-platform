import type { Metadata } from "next";

import { CategoryLandingPage } from "../../CategoryLandingPage";
import { getCategoryPageConfig } from "../../category-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ping Pong Balls | Tiger Ping Pong",
  description: "Shop Tiger Ping Pong ping pong balls."
};

export default function PingPongBallsPage() {
  return <CategoryLandingPage config={getCategoryPageConfig("balls")} />;
}
