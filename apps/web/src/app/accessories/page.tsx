import type { Metadata } from "next";

import { CategoryLandingPage } from "../CategoryLandingPage";
import { getCategoryPageConfig } from "../category-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ping Pong Accessories | Tiger Ping Pong",
  description: "Shop Tiger Ping Pong paddles, balls, covers, nets, and accessories."
};

export default function AccessoriesPage() {
  return <CategoryLandingPage config={getCategoryPageConfig("accessories")} />;
}
