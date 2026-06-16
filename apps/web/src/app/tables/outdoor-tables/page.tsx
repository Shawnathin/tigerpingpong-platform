import type { Metadata } from "next";

import { getPathMetadata } from "../../../lib/seo";
import { CategoryLandingPage } from "../../CategoryLandingPage";
import { getCategoryPageConfig } from "../../category-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getPathMetadata({
  pathname: "/tables/outdoor-tables",
  title: "Outdoor Ping Pong Tables | Tiger Ping Pong",
  description:
    "Shop Tiger Ping Pong outdoor tables for patios, backyards, garages, parks, and fresh-air rallies across Canada."
});

export default function OutdoorTablesPage() {
  return <CategoryLandingPage config={getCategoryPageConfig("outdoor-tables")} />;
}
