import type { Metadata } from "next";

import { getPathMetadata } from "../../../lib/seo";
import { CategoryLandingPage } from "../../CategoryLandingPage";
import { getCategoryPageConfig } from "../../category-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getPathMetadata({
  pathname: "/accessories/nets",
  title: "Ping Pong Nets | Tiger Ping Pong"
});

export default function NetsPage() {
  return <CategoryLandingPage config={getCategoryPageConfig("nets")} />;
}
