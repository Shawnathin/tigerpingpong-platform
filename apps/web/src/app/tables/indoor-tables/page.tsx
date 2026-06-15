import type { Metadata } from "next";

import { CategoryLandingPage } from "../../CategoryLandingPage";
import { getCategoryPageConfig } from "../../category-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Indoor Ping Pong Tables | Tiger Ping Pong",
  description: "Shop Tiger Ping Pong indoor ping pong tables."
};

export default function IndoorTablesPage() {
  return <CategoryLandingPage config={getCategoryPageConfig("indoor-tables")} />;
}
