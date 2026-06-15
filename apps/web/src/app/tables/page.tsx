import type { Metadata } from "next";

import { CategoryLandingPage } from "../CategoryLandingPage";
import { getCategoryPageConfig } from "../category-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ping Pong Tables | Tiger Ping Pong",
  description: "Shop Tiger Ping Pong indoor and outdoor ping pong tables."
};

export default function TablesPage() {
  return <CategoryLandingPage config={getCategoryPageConfig("tables")} />;
}
