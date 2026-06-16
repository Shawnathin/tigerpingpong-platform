import type { Metadata } from "next";

import { getPathMetadata } from "../../../lib/seo";
import { CategoryLandingPage } from "../../CategoryLandingPage";
import { getCategoryPageConfig } from "../../category-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getPathMetadata({
  pathname: "/accessories/paddles",
  title: "Ping Pong Paddles | Tiger Ping Pong",
  description:
    "Shop Tiger Ping Pong paddles for casual matches, home play, and everyday table tennis rallies."
});

export default function PaddlesPage() {
  return <CategoryLandingPage config={getCategoryPageConfig("paddles")} />;
}
