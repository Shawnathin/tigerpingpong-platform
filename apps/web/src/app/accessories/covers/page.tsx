import type { Metadata } from "next";

import { CategoryLandingPage } from "../../CategoryLandingPage";
import { getCategoryPageConfig } from "../../category-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ping Pong Table Covers | Tiger Ping Pong",
  description: "Shop Tiger Ping Pong ping pong table covers."
};

export default function CoversPage() {
  return <CategoryLandingPage config={getCategoryPageConfig("covers")} />;
}
