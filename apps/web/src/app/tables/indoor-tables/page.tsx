import type { Metadata } from "next";

import { getPathMetadata } from "../../../lib/seo";
import { CategoryLandingPage } from "../../CategoryLandingPage";
import { getCategoryPageConfig } from "../../category-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getPathMetadata({
  pathname: "/tables/indoor-tables",
  title: "Indoor Ping Pong Tables | Tiger Ping Pong",
  description:
    "Shop Tiger Ping Pong indoor tables for game rooms, family play, practice, and controlled indoor table tennis spaces."
});

export default function IndoorTablesPage() {
  return <CategoryLandingPage config={getCategoryPageConfig("indoor-tables")} />;
}
