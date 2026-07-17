import type { Metadata } from "next";

import { getPathMetadata } from "../../../lib/seo";
import { CategoryLandingPage } from "../../CategoryLandingPage";
import { getCategoryPageConfig } from "../../category-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getPathMetadata({
  pathname: "/tables/indoor-tables",
  title: "Indoor Ping Pong Tables | Tiger Ping Pong"
});

export default function IndoorTablesPage() {
  return <CategoryLandingPage config={getCategoryPageConfig("indoor-tables")} />;
}
