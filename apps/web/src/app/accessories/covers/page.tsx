import type { Metadata } from "next";

import { getPathMetadata } from "../../../lib/seo";
import { CategoryLandingPage } from "../../CategoryLandingPage";
import { getCategoryPageConfig } from "../../category-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getPathMetadata({
  pathname: "/accessories/covers",
  title: "Ping Pong Table Covers | Tiger Ping Pong",
  description:
    "Shop Tiger Ping Pong table covers for protecting ping pong tables and keeping the next match ready."
});

export default function CoversPage() {
  return <CategoryLandingPage config={getCategoryPageConfig("covers")} />;
}
