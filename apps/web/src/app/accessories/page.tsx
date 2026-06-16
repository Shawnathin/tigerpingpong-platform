import type { Metadata } from "next";

import { getPathMetadata } from "../../lib/seo";
import { CategoryLandingPage } from "../CategoryLandingPage";
import { getCategoryPageConfig } from "../category-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getPathMetadata({
  pathname: "/accessories",
  title: "Ping Pong Accessories | Tiger Ping Pong",
  description:
    "Shop Tiger Ping Pong paddles, balls, covers, nets, and table tennis accessories for play, protection, and everyday setup."
});

export default function AccessoriesPage() {
  return <CategoryLandingPage config={getCategoryPageConfig("accessories")} />;
}
