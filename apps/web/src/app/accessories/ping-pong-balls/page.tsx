import type { Metadata } from "next";

import { getPathMetadata } from "../../../lib/seo";
import { CategoryLandingPage } from "../../CategoryLandingPage";
import { getCategoryPageConfig } from "../../category-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getPathMetadata({
  pathname: "/accessories/ping-pong-balls",
  title: "Ping Pong Balls | Tiger Ping Pong"
});

export default function PingPongBallsPage() {
  return <CategoryLandingPage config={getCategoryPageConfig("balls")} />;
}
