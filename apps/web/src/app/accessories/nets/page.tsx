import type { Metadata } from "next";

import { CategoryLandingPage } from "../../CategoryLandingPage";
import { getCategoryPageConfig } from "../../category-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ping Pong Nets | Tiger Ping Pong",
  description: "Shop Tiger Ping Pong table tennis nets and post sets."
};

export default function NetsPage() {
  return <CategoryLandingPage config={getCategoryPageConfig("nets")} />;
}
