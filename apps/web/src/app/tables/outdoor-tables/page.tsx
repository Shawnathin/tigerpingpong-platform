import type { Metadata } from "next";

import { CategoryLandingPage } from "../../CategoryLandingPage";
import { getCategoryPageConfig } from "../../category-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Outdoor Ping Pong Tables | Tiger Ping Pong",
  description: "Shop Tiger Ping Pong outdoor ping pong tables."
};

export default function OutdoorTablesPage() {
  return <CategoryLandingPage config={getCategoryPageConfig("outdoor-tables")} />;
}
