import type { Metadata } from "next";

import { CategoryLandingPage } from "../CategoryLandingPage";
import { getCategoryPageConfig } from "../category-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Replacement Parts | Tiger Ping Pong",
  description: "Replacement parts support for Tiger Ping Pong products."
};

export default function ReplacementPartsPage() {
  return <CategoryLandingPage config={getCategoryPageConfig("replacement-parts")} />;
}
