import type { Metadata } from "next";

import { CategoryLandingPage } from "../../CategoryLandingPage";
import { getCategoryPageConfig } from "../../category-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ping Pong Paddles | Tiger Ping Pong",
  description: "Shop Tiger Ping Pong ping pong paddles."
};

export default function PaddlesPage() {
  return <CategoryLandingPage config={getCategoryPageConfig("paddles")} />;
}
